"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const securityEnhancements_1 = require("../../src/middleware/securityEnhancements");
const securityEnhancements_2 = require("../../src/middleware/securityEnhancements");
const database_1 = require("../../src/utils/database");
const auth_1 = require("../../src/utils/auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, securityEnhancements_2.validateInput)(req, res))
        return;
    if (!(0, securityEnhancements_1.registrationRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const { email, password, firstName, lastName } = req.body;
        if (!email || !password) {
            throw new errorHandler_1.ValidationError('Email and password are required');
        }
        // Enhanced email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new errorHandler_1.ValidationError('Invalid email format');
        }
        // Enhanced password validation
        if (password.length < 8) {
            throw new errorHandler_1.ValidationError('Password must be at least 8 characters');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(password)) {
            throw new errorHandler_1.ValidationError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }
        // Validate name inputs if provided
        if (firstName && (firstName.length > 50 || !/^[a-zA-Z\s'-]+$/.test(firstName))) {
            throw new errorHandler_1.ValidationError('Invalid first name format');
        }
        if (lastName && (lastName.length > 50 || !/^[a-zA-Z\s'-]+$/.test(lastName))) {
            throw new errorHandler_1.ValidationError('Invalid last name format');
        }
        // Check if user already exists
        const { data: existingUser } = await database_1.supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: { message: 'User already exists', code: 'USER_EXISTS' }
            });
            return;
        }
        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
        // Calculate trial end date (7 days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);
        // Create user
        const { data: newUser, error: createError } = await database_1.supabaseAdmin
            .from('users')
            .insert({
            email: email.toLowerCase(),
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            subscription_tier: 'trial',
            subscription_status: 'trialing',
            trial_end_date: trialEndDate.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
            .select()
            .single();
        if (createError || !newUser) {
            console.error('User creation error:', createError);
            throw new Error('Failed to create user');
        }
        // Create default user preferences
        await database_1.supabaseAdmin
            .from('user_preferences')
            .insert({
            user_id: newUser.id,
            dark_mode: false,
            auto_optimize_seo: true,
            enable_auto_delisting: true,
            default_listing_duration: 7,
            email_notifications: true,
            price_optimization_enabled: true,
            ai_description_enabled: true,
            updated_at: new Date().toISOString()
        });
        // Generate token pair
        const { accessToken, refreshToken } = (0, auth_1.generateTokenPair)(newUser.id);
        res.status(201).json({
            success: true,
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    firstName: newUser.first_name,
                    lastName: newUser.last_name,
                    subscriptionTier: newUser.subscription_tier,
                    subscriptionStatus: newUser.subscription_status,
                    trialEndDate: newUser.trial_end_date
                }
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
