
const incomeKeywords = [
  'gaji', 'terima', 'dapat', 'bonus', 'transfer masuk', 'pendapatan',
  'salary', 'income', 'receive', 'paid', 'earning', 'masuk'
];

function extractAmount(text) {
  const lowerText = text.toLowerCase().trim();
  const regex = /(?:rp\s*)?([\d]+(?:[.,][\d]+)?)\s*(ribu|rb|k|juta|jt|m|ratus)?/gi;
  let match;
  let maxAmount = 0;
  let foundWithUnit = false;

  console.log('Testing text:', lowerText);

  while ((match = regex.exec(lowerText)) !== null) {
    console.log('Match found:', match[0]);
    console.log('Groups:', match[1], match[2]);
    
    let numberStr = match[1].replace(/,/g, '.');
    const unit = match[2];
    
    if (numberStr.includes('.') && numberStr.split('.').pop()?.length === 3) {
      numberStr = numberStr.replace(/\./g, '');
    }

    let number = parseFloat(numberStr);
    console.log('Parsed partial number:', number);
    
    if (isNaN(number)) continue;

    if (unit) {
      const u = unit.toLowerCase();
      if (['ribu', 'rb', 'k'].includes(u)) number *= 1000;
      else if (['juta', 'jt', 'm'].includes(u)) number *= 1000000;
      else if (u === 'ratus') number *= 100;
    }

    console.log('Number after unit multiplier:', number);

    if (unit) {
      if (!foundWithUnit || number > maxAmount) {
        maxAmount = number;
        foundWithUnit = true;
      }
    } else if (number >= 1000) {
      if (!foundWithUnit && number > maxAmount) {
        maxAmount = number;
      }
    } else if (maxAmount === 0 && !foundWithUnit) {
      maxAmount = number;
    }
  }

  return maxAmount;
}

const testCase = "tadi aku beli balsem rp20000";
console.log('Final Result:', extractAmount(testCase));
