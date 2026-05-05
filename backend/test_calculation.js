// Test the exact calculation for 2.40 DT
console.log('Testing ticket calculation:');
console.log('Amount: 2.40');
console.log('Calculation: Math.floor(2.40 / 0.2)');
console.log('Result:', Math.floor(2.40 / 0.2));
console.log('2.40 / 0.2 =', 2.40 / 0.2);

// Test with potential floating point issues
console.log('\nTesting with floating point precision:');
console.log('2.4 / 0.2 =', 2.4 / 0.2);
console.log('Math.floor(2.4 / 0.2) =', Math.floor(2.4 / 0.2));

// Test what might be in the database
console.log('\nTesting potential database values:');
const testValues = [2.4, 2.40, 2.399999, 2.400001];
testValues.forEach(val => {
  console.log(`${val} / 0.2 = ${val / 0.2}, Math.floor = ${Math.floor(val / 0.2)}`);
});
