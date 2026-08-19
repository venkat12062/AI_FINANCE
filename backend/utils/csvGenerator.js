const { Parser } = require('json2csv');

const generateCSV = (transactions) => {
    // Expected Output: Date, Category, Type, Amount, Description
    const fields = [
        { label: 'Date', value: 'date' },
        { label: 'Category', value: 'category' },
        { label: 'Type', value: 'type' },
        { label: 'Amount', value: 'amount' },
        { label: 'Description', value: 'description' }
    ];

    const json2csvParser = new Parser({ fields });
    
    // Format the date and amount before converting
    const formattedData = transactions.map(t => ({
        date: new Date(t.transaction_date).toLocaleDateString('en-US'),
        category: t.category_name,
        type: t.type,
        amount: parseFloat(t.amount).toFixed(2),
        description: t.description || 'N/A'
    }));

    return json2csvParser.parse(formattedData);
};

module.exports = {
    generateCSV
};
