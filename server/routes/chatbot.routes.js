// routes/chatbot.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Load environment variables
require('dotenv').config();

const prisma = new PrismaClient();

// ============== GROQ AI CONFIGURATION ==============
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Correct Groq API endpoint
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Groq model names (Llama 3.x / Mixtral / Gemma2 were deprecated by Groq in mid-2026 —
// this list uses their recommended replacements. Check https://console.groq.com/docs/models
// if any of these ever fail, since Groq's lineup changes over time)
const GROQ_MODELS = [
    'openai/gpt-oss-120b',   // Best all-around quality (replaces llama-3.3-70b-versatile)
    'openai/gpt-oss-20b',    // Fastest, cheapest (replaces llama-3.1-8b-instant)
    'qwen/qwen3.6-27b'       // Alternative option
];

console.log('🤖 Chatbot running with Groq AI integration');
console.log('🔑 API Key configured:', GROQ_API_KEY ? '✅ Yes' : '❌ No');

// ============== NO AUTHENTICATION REQUIRED ==============
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'undefined' && token !== 'null') {
                try {
                    const parts = token.split('.');
                    if (parts.length === 3) {
                        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                        req.userId = decoded.userId || decoded.id;
                        req.userRole = decoded.role || 'USER';
                        req.userEmail = decoded.email;
                    }
                } catch (e) {}
            }
        }

        if (!req.userId) {
            let defaultUser = await prisma.user.findFirst();
            if (!defaultUser) {
                defaultUser = await prisma.user.create({
                    data: {
                        name: 'Guest User',
                        email: 'guest@genesisagri.com',
                        password: 'guest123',
                        role: 'USER'
                    }
                });
                console.log('✅ Created default guest user');
            }
            req.userId = defaultUser.id;
            req.userRole = defaultUser.role || 'USER';
            req.userEmail = defaultUser.email;
        }
        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        try {
            const defaultUser = await prisma.user.findFirst();
            if (defaultUser) {
                req.userId = defaultUser.id;
                req.userRole = defaultUser.role || 'USER';
                req.userEmail = defaultUser.email;
                next();
            } else {
                res.status(500).json({ success: false, error: 'Server error' });
            }
        } catch (err) {
            res.status(500).json({ success: false, error: 'Server error' });
        }
    }
};

// ============== AI RESPONSE GENERATOR ==============
class ChatbotAI {
    constructor() {
        this.contexts = {};
        this.products = [];
        this.initialized = false;
        this.workingModel = null;
        this.modelTested = false;
    }

    getSystemPrompt() {
        return `You are Genesis Agri's AI assistant, a helpful agricultural products chatbot. 
    
**Your Role:**
- Help customers find agricultural products (fertilizers, seeds, pesticides, equipment)
- Provide product information, pricing, and availability
- Assist with orders and general inquiries
- Be friendly, professional, and knowledgeable

**About Genesis Agri:**
- Leading agricultural products company
- Products: Fertilizers, Seeds, Pesticides, Equipment
- Mission: Revolutionizing agriculture through innovative products
- Serving farmers, agricultural businesses, and cooperatives since 2020

**Response Guidelines:**
1. Be concise but informative (2-3 sentences max)
2. Use emojis naturally to make responses engaging
3. Suggest specific products when possible
4. If you don't know something, suggest alternative ways to help
5. Keep responses focused on agricultural products and services

**Available Products:**
${this.products.map(p => `- ${p.name}: ${p.category}, $${p.price}/${p.unitOfMeasurement || 'unit'}, ${p.stock} in stock`).join('\n')}

**Contact Information:**
- Email: support@genesisagri.com
- Phone: +251 91 234 5678
- Hours: Mon-Fri 8AM - 6PM EAT (East Africa Time)

Generate helpful, friendly, and accurate responses to user queries.`;
    }

    async initialize() {
        if (this.initialized) return;
        try {
            const products = await prisma.product.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    category: true,
                    stock: true,
                    unitOfMeasurement: true,
                    images: true,
                    discountPrice: true,
                    brand: true
                },
                where: {
                    stock: { gt: 0 },
                    visibility: 'VISIBLE',
                    status: 'APPROVED'
                }
            });
            this.products = products;
            this.initialized = true;
            console.log('✅ Chatbot initialized with', products.length, 'products');

            // Try to find working model
            if (GROQ_API_KEY && !this.modelTested) {
                await this.findWorkingModel();
            }
        } catch (error) {
            console.error('❌ Failed to initialize chatbot:', error);
        }
    }

    async findWorkingModel() {
        this.modelTested = true;
        console.log('🔍 Testing Groq API connection...');

        for (const model of GROQ_MODELS) {
            try {
                console.log(`🔄 Testing model: ${model}`);
                const response = await axios.post(
                    GROQ_API_URL,
                    {
                        model: model,
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 5
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${GROQ_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    }
                );

                if (response.status === 200) {
                    this.workingModel = model;
                    console.log(`✅ Groq API working with model: ${model}`);
                    return;
                }
            } catch (error) {
                console.log(`❌ Model ${model} failed:`, error.response?.data?.error?.message || error.message);
                // Continue to next model
            }
        }

        console.log('⚠️ No working Groq model found. Will use fallback responses.');
        console.log('💡 Tip: Make sure your GROQ_API_KEY is valid — check https://console.groq.com/keys');
    }

    getContext(userId) {
        if (!this.contexts[userId]) {
            this.contexts[userId] = {
                history: [],
                currentOrder: null,
                lastInteraction: Date.now(),
                userName: ''
            };
        }
        return this.contexts[userId];
    }

    async generateResponse(message, userId, conversationId) {
        await this.initialize();

        const context = this.getContext(userId);

        if (!context.userName) {
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { name: true }
                });
                context.userName = user ? user.name : 'Guest';
            } catch (e) {
                context.userName = 'Guest';
            }
        }

        context.history.push({ role: 'user', content: message });

        // Generate response using Groq AI
        const response = await this.generateAIResponse(message, context);

        context.history.push({ role: 'assistant', content: response });
        context.lastInteraction = Date.now();

        await this.saveChatHistory(userId, conversationId, message, response);

        return response;
    }

    async generateAIResponse(message, context) {
        // Check if API key is available
        if (!GROQ_API_KEY) {
            console.warn('⚠️ GROQ_API_KEY not configured, using fallback responses');
            const lowerMessage = message.toLowerCase().trim();
            return await this.processRuleBasedIntent(lowerMessage, context);
        }

        // If we don't have a working model, use fallback
        if (!this.workingModel) {
            // Try one more time to find a working model
            await this.findWorkingModel();
            if (!this.workingModel) {
                console.warn('⚠️ No working Groq model found, using fallback responses');
                const lowerMessage = message.toLowerCase().trim();
                return await this.processRuleBasedIntent(lowerMessage, context);
            }
        }

        try {
            // Build conversation history for context
            const history = context.history.slice(-5);

            // Prepare messages for Groq API
            const messages = [
                {
                    role: 'system',
                    content: this.getSystemPrompt()
                }
            ];

            // Add conversation history
            history.forEach(msg => {
                if (msg.role === 'user') {
                    messages.push({ role: 'user', content: msg.content });
                } else {
                    messages.push({ role: 'assistant', content: msg.content });
                }
            });

            // Add current message
            messages.push({ role: 'user', content: message });

            // Make API call to Groq
            const response = await axios.post(
                GROQ_API_URL,
                {
                    model: this.workingModel,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 300,
                    top_p: 0.9,
                    stream: false
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 15000
                }
            );

            // Extract the response
            const aiResponse = response.data.choices[0].message.content;
            return aiResponse;

        } catch (error) {
            console.error('❌ Groq API Error:', error.response?.data || error.message);

            // If the model was decommissioned or invalid, clear it and retry with another
            if (error.response?.status === 400 || error.response?.data?.error?.code === 'model_not_found') {
                this.workingModel = null;
                await this.findWorkingModel();
            }

            // Check for specific error types
            if (error.response?.status === 401) {
                console.error('⚠️ Invalid Groq API key. Please check your .env file');
                return 'I apologize, but I\'m having trouble connecting to my AI service. Please check the API configuration. 🤖';
            }

            if (error.response?.status === 429) {
                console.error('⚠️ Rate limit exceeded for Groq API');
                return 'I\'m receiving too many requests right now. Please wait a moment and try again. ⏳';
            }

            // Fallback to rule-based responses
            console.log('⚠️ Falling back to rule-based responses');
            const lowerMessage = message.toLowerCase().trim();
            return await this.processRuleBasedIntent(lowerMessage, context);
        }
    }

    // ========== FALLBACK: RULE-BASED RESPONSES ==========
    async processRuleBasedIntent(message, context) {
        // Check if it's a greeting
        if (this.matchesPattern(message, ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'selam', 'hola'])) {
            return this.getGreetingResponse(context);
        }

        // Product search
        if (this.matchesPattern(message, ['search', 'find', 'looking for', 'need', 'want', 'product', 'item', 'show', 'get'])) {
            return await this.handleProductSearch(message, context);
        }

        // Category browse
        if (this.matchesPattern(message, ['category', 'categories', 'types', 'kind of', 'sort', 'browse'])) {
            return this.handleCategoryBrowse();
        }

        // Product details
        if (this.matchesPattern(message, ['details', 'info', 'information', 'tell me about', 'what is', 'describe'])) {
            return await this.handleProductDetails(message);
        }

        // Price inquiry
        if (this.matchesPattern(message, ['price', 'cost', 'how much', 'expensive', 'cheap', 'pricing'])) {
            return await this.handlePriceInquiry(message);
        }

        // Stock inquiry
        if (this.matchesPattern(message, ['stock', 'available', 'in stock', 'quantity', 'availability'])) {
            return await this.handleStockInquiry(message);
        }

        // Order related
        if (this.matchesPattern(message, ['order', 'buy', 'purchase', 'checkout', 'cart', 'shopping', 'add to cart'])) {
            return this.handleOrderInquiry();
        }

        // Login related
        if (this.matchesPattern(message, ['login', 'sign in', 'log in', 'signin', 'register', 'sign up'])) {
            return this.getLoginHelpResponse();
        }

        // Help
        if (this.matchesPattern(message, ['help', 'support', 'assist', 'guide', 'how to', 'what can you do'])) {
            return this.getHelpResponse();
        }

        // About
        if (this.matchesPattern(message, ['about', 'company', 'genesis agri', 'genesis', 'who are you', 'what is genesis'])) {
            return this.getAboutResponse();
        }

        // Contact
        if (this.matchesPattern(message, ['contact', 'phone', 'email', 'reach', 'call', 'message', 'support'])) {
            return this.getContactResponse();
        }

        // Farewell
        if (this.matchesPattern(message, ['bye', 'goodbye', 'see you', 'thank you', 'thanks', 'cya', 'later'])) {
            return this.getFarewellResponse(context);
        }

        return this.getDefaultResponse();
    }

    matchesPattern(message, patterns) {
        return patterns.some(pattern => message.includes(pattern));
    }

    // ========== RESPONSE GENERATORS ==========

    getGreetingResponse(context) {
        const hour = new Date().getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
        if (hour >= 17) greeting = 'Good evening';

        const name = context.userName || 'Guest';
        const responses = [
            `${greeting}${name ? ' ' + name : ''}! 👋 Welcome to Genesis Agri. How can I help you with our agricultural products today?`,
            `Hello${name ? ' ' + name : ''}! 🌱 I'm your Genesis Agri assistant. Need help finding the perfect agricultural products?`,
            `Hi there${name ? ' ' + name : ''}! 🌾 Ready to explore our premium agricultural products? Let me know what you need.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getLoginHelpResponse() {
        return `🔐 **Login/Register Help**\n\n` +
            `To access all features of Genesis Agri:\n\n` +
            `1. Go to the login page (click "Login" in the navigation)\n` +
            `2. Enter your email and password\n` +
            `3. Click "Sign In"\n\n` +
            `📧 **Demo Credentials:**\n` +
            `Admin: admingen@gmail.com / admin@123\n` +
            `User: user@genesisagri.com / user@123\n\n` +
            `Don't have an account? Click "Register" to create one! 🔑`;
    }

    async handleProductSearch(message, context) {
        const keywords = message.replace(/search|find|looking for|need|want|product|item|show|get/gi, '').trim();

        if (!keywords || keywords.length < 2) {
            return `What type of agricultural products are you looking for? We have fertilizers, seeds, pesticides, farming equipment, and more! 🌱`;
        }

        const searchResults = this.products.filter(p =>
            p.name.toLowerCase().includes(keywords.toLowerCase()) ||
            p.description.toLowerCase().includes(keywords.toLowerCase()) ||
            p.category.toLowerCase().includes(keywords.toLowerCase())
        );

        if (searchResults.length === 0) {
            return `I couldn't find any products matching "${keywords}". 🤔 Could you try different keywords? We have a wide range of agricultural products including fertilizers, seeds, pesticides, and equipment.`;
        }

        if (searchResults.length > 5) {
            const topResults = searchResults.slice(0, 5);
            return `I found ${searchResults.length} products matching "${keywords}". Here are the top 5:\n\n${topResults.map((p, i) =>
                `${i+1}. **${p.name}** - $${p.price} per ${p.unitOfMeasurement || 'unit'} (${p.category})\n   ${p.description.substring(0, 80)}...`
            ).join('\n\n')}\n\nWould you like more details on any of these? 🔍`;
        }

        return `I found ${searchResults.length} product(s) matching "${keywords}":\n\n${searchResults.map((p, i) =>
            `${i+1}. **${p.name}**\n   Price: $${p.price} per ${p.unitOfMeasurement || 'unit'}\n   Category: ${p.category}\n   Stock: ${p.stock} units\n   ${p.description}`
        ).join('\n\n')}\n\nWould you like to know more about any specific product? 📦`;
    }

    handleCategoryBrowse() {
        const categories = [...new Set(this.products.map(p => p.category))];

        if (categories.length === 0) {
            return 'We have various agricultural products available. Please check our website for the complete catalog. 📋';
        }

        return `We offer products in these categories:\n\n${categories.map((cat, i) =>
            `${i+1}. **${cat}** - ${this.products.filter(p => p.category === cat).length} products available`
        ).join('\n')}\n\nWhich category interests you? I can show you specific products! 🔍`;
    }

    async handleProductDetails(message) {
        const keywords = message.replace(/details|info|information|tell me about|what is|describe/gi, '').trim();

        if (!keywords) {
            return 'Which product would you like to know more about? Please specify the name. 📝';
        }

        const product = this.products.find(p =>
            p.name.toLowerCase().includes(keywords.toLowerCase()) ||
            keywords.toLowerCase().includes(p.name.toLowerCase())
        );

        if (!product) {
            return `I couldn't find detailed information about "${keywords}". Could you try another product name? 🤔`;
        }

        return `📦 **${product.name}**\n\n` +
            `📝 Description: ${product.description}\n` +
            `💰 Price: $${product.price} per ${product.unitOfMeasurement || 'unit'}\n` +
            `📂 Category: ${product.category}\n` +
            `📊 Stock: ${product.stock} units available\n` +
            `🆔 Product ID: ${product.id}\n\n` +
            `Would you like to place an order for this product? 🛒`;
    }

    async handlePriceInquiry(message) {
        const keywords = message.replace(/price|cost|how much|expensive|cheap|pricing/gi, '').trim();

        if (!keywords) {
            return 'Which product\'s price would you like to know? Please specify the product name. 💰';
        }

        const product = this.products.find(p =>
            p.name.toLowerCase().includes(keywords.toLowerCase()) ||
            keywords.toLowerCase().includes(p.name.toLowerCase())
        );

        if (!product) {
            return `I couldn't find pricing for "${keywords}". Could you specify which product you're interested in? 💰`;
        }

        return `💰 **${product.name}**\n` +
            `Price: $${product.price} per ${product.unitOfMeasurement || 'unit'}\n` +
            `Bulk discounts available for orders over 100 units!\n\n` +
            `Would you like to place an order? 🛒`;
    }

    async handleStockInquiry(message) {
        const keywords = message.replace(/stock|available|in stock|quantity|availability/gi, '').trim();

        if (!keywords) {
            return 'Which product\'s availability would you like to check? 📊';
        }

        const product = this.products.find(p =>
            p.name.toLowerCase().includes(keywords.toLowerCase()) ||
            keywords.toLowerCase().includes(p.name.toLowerCase())
        );

        if (!product) {
            return `I couldn't find stock information for "${keywords}". Could you try another product? 📊`;
        }

        const status = product.stock > 50 ? '✅ In stock' :
                       product.stock > 10 ? '⚠️ Limited stock' :
                       '🔴 Low stock - Order soon!';

        return `📊 **${product.name}**\n` +
            `Stock: ${product.stock} units\n` +
            `Status: ${status}\n\n` +
            (product.stock < 20 ? `⚠️ Only ${product.stock} units left! Order now to avoid disappointment.` : '');
    }

    handleOrderInquiry() {
        return `To place an order, please:\n\n` +
            `1. Browse our products at /products\n` +
            `2. Add items to your cart\n` +
            `3. Proceed to checkout\n\n` +
            `Would you like me to help you find specific products? 🛒`;
    }

    getHelpResponse() {
        return `I can help you with:\n\n` +
            `🔍 **Product Search** - "Find organic fertilizer"\n` +
            `💰 **Pricing** - "How much is wheat seed?"\n` +
            `📊 **Availability** - "Is herbicide in stock?"\n` +
            `📂 **Categories** - "Show me fertilizer types"\n` +
            `🛒 **Ordering** - "How to place an order?"\n` +
            `🔐 **Login** - "How to login"\n` +
            `📞 **Contact** - "Get customer support"\n\n` +
            `What would you like to know? 🤔`;
    }

    getAboutResponse() {
        return `🌱 **About Genesis Agri**\n\n` +
            `Genesis Agri is a leading agricultural products company dedicated to empowering farmers with high-quality solutions.\n\n` +
            `🏆 **Our Mission**: Revolutionizing agriculture through innovative products\n` +
            `🌾 **Our Products**: Fertilizers, Seeds, Pesticides, Equipment\n` +
            `👨‍🌾 **Our Clients**: Farmers, Agricultural businesses, Cooperatives\n\n` +
            `Since 2020, we've been serving the agricultural community with excellence! ✨`;
    }

    getContactResponse() {
        return `📞 **Contact Genesis Agri**\n\n` +
            `📧 Email: support@genesisagri.com\n` +
            `📱 Phone: +251 91 234 5678\n` +
            `🕐 Hours: Mon-Fri 8AM - 6PM EAT (East Africa Time)\n` +
            `🌐 Website: www.genesisagri.com\n` +
            `📍 Location: Bahir Dar, Amhara, Ethiopia\n\n` +
            `How can we assist you today? 🤝`;
    }

    getFarewellResponse(context) {
        const name = context.userName || 'Guest';
        const responses = [
            `Thank you for chatting${name ? ' ' + name : ''}! 🌾 Have a great day! Feel free to come back anytime.`,
            `Goodbye${name ? ' ' + name : ''}! 👋 If you have more questions, I'm always here to help.`,
            `Thanks for visiting Genesis Agri${name ? ', ' + name : ''}! 🌱 Happy farming!`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getDefaultResponse() {
        const suggestions = [
            'I can help you find products, check prices, or assist with orders.',
            'Would you like to browse our products by category?',
            'I can tell you about our fertilizers, seeds, or pesticides.',
            'Need help with something specific? Just ask!'
        ];
        return `I'm not sure I understand. 🤔\n\n${suggestions[Math.floor(Math.random() * suggestions.length)]}\n\nTry asking about:\n• "Find organic fertilizer"\n• "Show me pesticides"\n• "How much is corn seed?"\n• "Help with ordering"`;
    }

    async saveChatHistory(userId, conversationId, userMessage, botResponse) {
        try {
            if (!userId) {
                console.warn('No userId provided, skipping chat history save');
                return;
            }

            const userExists = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!userExists) {
                console.warn(`User with ID ${userId} not found, skipping chat history save`);
                return;
            }

            await prisma.chatMessage.create({
                data: {
                    userId: userId,
                    conversationId: conversationId || uuidv4(),
                    userMessage: userMessage,
                    botResponse: botResponse,
                    timestamp: new Date()
                }
            });
            console.log('✅ Chat history saved successfully');
        } catch (error) {
            console.error('Error saving chat history:', error.message);
        }
    }
}

// Initialize AI
const chatbotAI = new ChatbotAI();
chatbotAI.initialize();

// ============== ROUTES ==============

/**
 * POST /api/chatbot/message - NO AUTHENTICATION REQUIRED
 */
router.post('/message', optionalAuth, async (req, res) => {
    try {
        const { message, conversationId } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        const response = await chatbotAI.generateResponse(message, req.userId, conversationId);

        res.json({
            success: true,
            data: {
                message: response,
                conversationId: conversationId || uuidv4(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/chatbot/history - NO AUTHENTICATION REQUIRED
 */
router.get('/history', optionalAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 50, offset = 0 } = req.query;

        if (!userId) {
            return res.json({
                success: true,
                data: { messages: [], pagination: { total: 0, limit: 0, offset: 0, hasMore: false } }
            });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { userId: userId },
            orderBy: { timestamp: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset)
        });

        const total = await prisma.chatMessage.count({
            where: { userId: userId }
        });

        res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: offset + limit < total
                }
            }
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch chat history'
        });
    }
});

/**
 * DELETE /api/chatbot/history - NO AUTHENTICATION REQUIRED
 */
router.delete('/history', optionalAuth, async (req, res) => {
    try {
        const userId = req.userId;

        if (!userId) {
            return res.json({ success: true, data: { message: 'No history to clear' } });
        }

        await prisma.chatMessage.deleteMany({
            where: { userId: userId }
        });

        res.json({
            success: true,
            data: { message: 'Chat history cleared successfully' }
        });
    } catch (error) {
        console.error('Error clearing chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear chat history'
        });
    }
});

/**
 * GET /api/chatbot/unread/count - NO AUTHENTICATION REQUIRED
 */
router.get('/unread/count', optionalAuth, async (req, res) => {
    try {
        res.json({ success: true, data: { unreadCount: 0 } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch unread count' });
    }
});

/**
 * GET /api/chatbot/products - NO AUTHENTICATION REQUIRED
 */
router.get('/products', optionalAuth, async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                category: true,
                stock: true,
                unitOfMeasurement: true,
                images: true,
                discountPrice: true,
                brand: true
            },
            where: {
                stock: { gt: 0 },
                visibility: 'VISIBLE',
                status: 'APPROVED'
            }
        });

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch products' });
    }
});

module.exports = router;