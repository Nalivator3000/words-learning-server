function findYesterdayExpenses() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const yesterdayFormats = [
        yesterday.toLocaleDateString('en-US'),
        yesterday.toLocaleDateString('en-GB'),  
        yesterday.toISOString().split('T')[0],
        yesterday.toLocaleDateString(),
        formatDateForFacebook(yesterday)
    ];
    
    let totalExpense = 0;
    let foundExpenses = [];
    
    const tables = document.querySelectorAll('table, [role="table"], [role="grid"]');
    
    for (const table of tables) {
        const rows = table.querySelectorAll('tr, [role="row"]');
        
        for (const row of rows) {
            const cells = row.querySelectorAll('td, th, [role="gridcell"], [role="columnheader"]');
            const rowText = row.textContent;
            
            const hasYesterdayDate = yesterdayFormats.some(format => 
                rowText.includes(format) || isDateMatch(rowText, yesterday)
            );
            
            if (hasYesterdayDate) {
                const expenseInRow = extractExpenseFromRow(row, cells);
                if (expenseInRow > 0) {
                    foundExpenses.push(expenseInRow);
                    totalExpense += expenseInRow;
                }
            }
        }
    }
    
    if (foundExpenses.length === 0) {
        const fallbackExpense = extractFallbackExpense();
        if (fallbackExpense > 0) {
            totalExpense = fallbackExpense;
            foundExpenses = [fallbackExpense];
        }
    }
    
    return {
        total: totalExpense,
        individual: foundExpenses,
        formatted: totalExpense.toFixed(2)
    };
}

function formatDateForFacebook(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function isDateMatch(text, targetDate) {
    const yesterday = targetDate;
    const dayBefore = new Date(targetDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    const patterns = [
        /yesterday/i,
        new RegExp(yesterday.getDate().toString()),
        new RegExp(`${yesterday.getMonth() + 1}/${yesterday.getDate()}`),
        new RegExp(`${yesterday.getDate()}/${yesterday.getMonth() + 1}`)
    ];
    
    return patterns.some(pattern => pattern.test(text));
}

function extractExpenseFromRow(row, cells) {
    const spendPatterns = [
        /amount\s+spent/i,
        /spend/i,
        /cost/i,
        /expense/i,
        /total/i
    ];
    
    let maxExpense = 0;
    
    for (const cell of cells) {
        const cellText = cell.textContent || '';
        const cellHTML = cell.innerHTML || '';
        
        const hasSpendIndicator = spendPatterns.some(pattern => 
            pattern.test(cellText) || pattern.test(cell.getAttribute('aria-label') || '') ||
            pattern.test(cell.title || '')
        );
        
        if (hasSpendIndicator || cellText.includes('$')) {
            const expenses = extractMoneyValues(cellText);
            const maxInCell = Math.max(...expenses, 0);
            if (maxInCell > maxExpense) {
                maxExpense = maxInCell;
            }
        }
    }
    
    if (maxExpense === 0) {
        const rowText = row.textContent || '';
        const allExpenses = extractMoneyValues(rowText);
        maxExpense = Math.max(...allExpenses, 0);
    }
    
    return maxExpense;
}

function extractMoneyValues(text) {
    const patterns = [
        /\$[\d,]+\.?\d*/g,
        /\d+\.\d{2}/g,
        /[\d,]+\.\d{2}/g
    ];
    
    const values = [];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern) || [];
        for (const match of matches) {
            const cleaned = match.replace(/[$,]/g, '');
            const num = parseFloat(cleaned);
            if (!isNaN(num) && num > 0 && num < 1000000) {
                values.push(num);
            }
        }
    }
    
    return values;
}

function extractFallbackExpense() {
    const possibleElements = document.querySelectorAll(`
        [data-testid*="amount_spent"],
        [data-testid*="spend"],
        [aria-label*="spent"],
        [title*="spent"],
        .spent,
        [class*="spend"],
        [class*="cost"],
        [class*="expense"]
    `);
    
    let maxExpense = 0;
    
    for (const element of possibleElements) {
        const text = element.textContent || element.getAttribute('aria-label') || element.title || '';
        const expenses = extractMoneyValues(text);
        const maxInElement = Math.max(...expenses, 0);
        if (maxInElement > maxExpense) {
            maxExpense = maxInElement;
        }
    }
    
    if (maxExpense === 0) {
        const allText = document.body.innerText;
        const allExpenses = extractMoneyValues(allText);
        if (allExpenses.length > 0) {
            maxExpense = allExpenses.reduce((sum, val) => sum + val, 0) / allExpenses.length;
        }
    }
    
    return maxExpense;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { findYesterdayExpenses };
}