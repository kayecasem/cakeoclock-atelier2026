// Example Node.js logic
app.post('/api/chat', async (req, res) => {
    const { message, userId } = req.body;

    // 1. RULE-BASED CHECK (Approach A)
    if (message.toLowerCase() === 'store hours') {
        return res.json({ text: "We are open Tuesday to Sunday, 9 AM - 7 PM!" });
    }

    // 2. DATABASE INTEGRATION (Hybrid Power)
    if (message.toLowerCase().includes('order status')) {
        // You can query your MySQL database here using the userId
        const [order] = await db.query("SELECT status FROM orders WHERE user_id = ?", [userId]);
        return res.json({ text: `Your pastry order is currently: ${order.status}` });
    }

    // 3. AI FALLBACK (Approach B)
    // If it doesn't match a rule, pass it to Google Gemini or OpenAI
    const aiResponse = await callLLMAPI(message); 
    return res.json({ text: aiResponse });
});