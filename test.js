var a = {
	'test':[0, 1, 5, 6]
};

// Shows all indexes, not just those that have been assigned values
// a.find(function (value, index) {
// 	console.log('Visited index ' + index + ' with value ' + value);
// });

// // Shows all indexes, including deleted
// a.find(function (value, index) {

// 	// Delete element 5 on first iteration
// 	if (index == 2) {
// 		console.log('Deleting a[5] with value ' + a[2]);
// 		a
// 	}
// 	// Element 5 is still visited even though deleted
// 	console.log('Visited index ' + index + ' with value ' + value);
// });
let t = a.test.findIndex(t => t === 1);
console.log(t);
a.test.splice(1,1);

console.log(a);