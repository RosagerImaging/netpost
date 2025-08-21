-- Function to automatically update inventory quantity when items are sold
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    UPDATE inventory_items 
    SET 
      quantity_available = GREATEST(0, quantity_available - NEW.quantity),
      updated_at = NOW()
    WHERE id = NEW.inventory_item_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory when marketplace listing is sold
CREATE TRIGGER trigger_update_inventory_on_sale
  AFTER UPDATE ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();

-- Function to calculate sales analytics
CREATE OR REPLACE FUNCTION calculate_user_analytics(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_revenue DECIMAL(12,2) := 0;
  total_profit DECIMAL(12,2) := 0;
  total_costs DECIMAL(12,2) := 0;
  items_sold INTEGER := 0;
  avg_selling_price DECIMAL(10,2) := 0;
  avg_days_to_sell DECIMAL(8,2) := 0;
  platform_data JSONB := '{}';
  category_data JSONB := '{}';
BEGIN
  -- Calculate totals from sold marketplace listings
  SELECT 
    COALESCE(SUM(ml.price * ml.quantity), 0),
    COUNT(*),
    COALESCE(AVG(ml.price), 0),
    COALESCE(AVG(EXTRACT(EPOCH FROM (ml.last_updated - ml.listing_date))/86400), 0)
  INTO total_revenue, items_sold, avg_selling_price, avg_days_to_sell
  FROM marketplace_listings ml
  JOIN inventory_items ii ON ii.id = ml.inventory_item_id
  WHERE ii.user_id = p_user_id 
    AND ml.status = 'sold'
    AND ml.last_updated >= p_start_date 
    AND ml.last_updated <= p_end_date;

  -- Calculate cost basis for sold items
  SELECT COALESCE(SUM(ii.cost_basis * ml.quantity), 0)
  INTO total_costs
  FROM marketplace_listings ml
  JOIN inventory_items ii ON ii.id = ml.inventory_item_id
  WHERE ii.user_id = p_user_id 
    AND ml.status = 'sold'
    AND ml.last_updated >= p_start_date 
    AND ml.last_updated <= p_end_date;

  total_profit := total_revenue - total_costs;

  -- Calculate platform breakdown
  SELECT jsonb_object_agg(
    ml.platform,
    jsonb_build_object(
      'revenue', COALESCE(SUM(ml.price * ml.quantity), 0),
      'items_sold', COUNT(*),
      'avg_price', COALESCE(AVG(ml.price), 0)
    )
  )
  INTO platform_data
  FROM marketplace_listings ml
  JOIN inventory_items ii ON ii.id = ml.inventory_item_id
  WHERE ii.user_id = p_user_id 
    AND ml.status = 'sold'
    AND ml.last_updated >= p_start_date 
    AND ml.last_updated <= p_end_date
  GROUP BY ml.platform;

  -- Calculate category breakdown
  SELECT jsonb_object_agg(
    ii.category,
    jsonb_build_object(
      'revenue', COALESCE(SUM(ml.price * ml.quantity), 0),
      'items_sold', COUNT(*),
      'avg_price', COALESCE(AVG(ml.price), 0)
    )
  )
  INTO category_data
  FROM marketplace_listings ml
  JOIN inventory_items ii ON ii.id = ml.inventory_item_id
  WHERE ii.user_id = p_user_id 
    AND ml.status = 'sold'
    AND ml.last_updated >= p_start_date 
    AND ml.last_updated <= p_end_date
  GROUP BY ii.category;

  result := jsonb_build_object(
    'total_revenue', total_revenue,
    'total_profit', total_profit,
    'total_costs', total_costs,
    'items_sold', items_sold,
    'average_selling_price', avg_selling_price,
    'average_days_to_sell', avg_days_to_sell,
    'platform_breakdown', COALESCE(platform_data, '{}'),
    'category_breakdown', COALESCE(category_data, '{}')
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get inventory metrics
CREATE OR REPLACE FUNCTION get_inventory_metrics(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  total_items INTEGER := 0;
  active_listings INTEGER := 0;
  sold_items INTEGER := 0;
  draft_items INTEGER := 0;
  total_value DECIMAL(12,2) := 0;
  avg_cost_basis DECIMAL(10,2) := 0;
BEGIN
  -- Get basic inventory counts
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'sold'),
    COUNT(*) FILTER (WHERE status = 'draft'),
    COALESCE(SUM(retail_price * quantity_available), 0),
    COALESCE(AVG(cost_basis), 0)
  INTO total_items, active_listings, sold_items, draft_items, total_value, avg_cost_basis
  FROM inventory_items
  WHERE user_id = p_user_id;

  result := jsonb_build_object(
    'total_items', total_items,
    'active_listings', active_listings,
    'sold_items', sold_items,
    'draft_items', draft_items,
    'total_value', total_value,
    'average_cost_basis', avg_cost_basis
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to detect dead stock (items listed for more than 30 days without selling)
CREATE OR REPLACE FUNCTION get_dead_stock(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  inventory_item_id UUID,
  title TEXT,
  days_listed INTEGER,
  current_price DECIMAL(10,2),
  suggested_actions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ii.id,
    ii.title,
    EXTRACT(DAY FROM (NOW() - MIN(ml.listing_date)))::INTEGER,
    ii.retail_price,
    ARRAY[
      CASE WHEN ii.retail_price > (SELECT AVG(retail_price) FROM inventory_items WHERE user_id = p_user_id AND category = ii.category) * 1.2 
           THEN 'Consider reducing price' 
           ELSE NULL END,
      'Improve SEO optimization',
      'Update photos',
      'Cross-list to more platforms'
    ]::TEXT[] - ARRAY[NULL]
  FROM inventory_items ii
  JOIN marketplace_listings ml ON ml.inventory_item_id = ii.id
  WHERE ii.user_id = p_user_id
    AND ii.status = 'active'
    AND ml.status = 'active'
    AND ml.listing_date < (NOW() - INTERVAL '1 day' * p_days)
  GROUP BY ii.id, ii.title, ii.retail_price, ii.category
  ORDER BY MIN(ml.listing_date) ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically sync inventory across platforms
CREATE OR REPLACE FUNCTION sync_inventory_across_platforms(p_inventory_item_id UUID)
RETURNS VOID AS $$
DECLARE
  item_quantity INTEGER;
BEGIN
  -- Get current available quantity
  SELECT quantity_available INTO item_quantity
  FROM inventory_items
  WHERE id = p_inventory_item_id;

  -- Update all active listings for this item
  UPDATE marketplace_listings
  SET 
    quantity = LEAST(quantity, item_quantity),
    status = CASE 
      WHEN item_quantity = 0 THEN 'out_of_stock'::listing_status
      ELSE status
    END,
    last_updated = NOW()
  WHERE inventory_item_id = p_inventory_item_id
    AND status = 'active';

  -- Update inventory item status if no quantity available
  IF item_quantity = 0 THEN
    UPDATE inventory_items
    SET status = 'grayed_out'
    WHERE id = p_inventory_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;