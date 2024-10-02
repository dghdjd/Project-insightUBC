import Decimal from "decimal.js";

let maps: {[key: string]: string} = {
	dept: "Subject", fullname: "fullname",
	id: "Course", shortname: "shortname",
	avg: "Avg", number: "number",
	instructor: "Professor", name: "name",
	title: "Title", address: "address",
	pass: "Pass", lat: "lat",
	fail: "Fail", lon: "lon",
	audit: "Audit", seats: "seats",
	uuid: "id", type: "type",
	year: "Year", furniture: "furniture",
	href: "href"
};

export function ColumnsAndSort(sections: any[], columns: any, order: any, query: any): any[] {
	let results: any[];
	if (Object.prototype.hasOwnProperty.call(query, "TRANSFORMATIONS")) {
		let groupKeys: any[] = query.TRANSFORMATIONS["GROUP"]; // [courses_title ...]
		results = group(groupKeys, sections, sections, columns, query, 0, groupKeys.length);
	} else {
		results = sections.map(function (obj) {
			let result: any = {};
			for (let column of columns) {
				let datasetID = column.substring(0, column.indexOf("_"));
				let key = column.substring(datasetID.length + 1);
				result[column] = obj[maps[key]];
			}
			return result;
		});
	}
	if (query.OPTIONS.ORDER) {
		if (typeof query.OPTIONS.ORDER === "object") {
			let arrLength = query.OPTIONS.ORDER["keys"].length;
			let prevKey = query.OPTIONS.ORDER["keys"][arrLength];
			if (query.OPTIONS.ORDER["dir"] === "DOWN") {
				results = sortDown(results, prevKey);
				for (let i = arrLength; i > 0; i--) {
					let currKey = query.OPTIONS.ORDER["keys"][i - 1];
					if (currKey !== prevKey) {
						results = sortDown(results, currKey);
					}
				}
				return results;
			} else {
				results = sortUp(results, prevKey);
				for (let i = arrLength; i > 0; i--) {
					let currKey = query.OPTIONS.ORDER["keys"][i - 1];
					if (currKey !== prevKey) {
						results = sortUp(results, currKey);
					}
				}
				return results;
			}
		}
		if (typeof order === "string") {
			results = sortUp(results,order);
		}
	}
	return results;
}

function sortDown(results: any[], key: any) {
	results.sort(function (a, b) {
		if (a[key] < b[key]) {
			return 1;
		} else if (a[key] > b[key]) {
			return -1;
		} else {
			return 0;
		}
	});
	return results;
}

function sortUp(results: any[], key: any) {
	results.sort(function (a, b) {
		if (a[key] > b[key]) {
			return 1;
		} else if (a[key] < b[key]) {
			return -1;
		} else {
			return 0;
		}
	});
	return results;
}

function ApplyCalculate(sections: any[], columnKey: string, trans: any, results: any[]): any {
	let Apply = trans["APPLY"];
	for (let a of Apply) {
		let applyKey = Object.keys(a)[0]; // overallAvg
		if (applyKey === columnKey) {
			let applyKey1 = a[applyKey]; //  "AVG": "courses_avg"
			let sortKey = Object.keys(applyKey1)[0]; // "AVG"
			let searchKey = applyKey1[sortKey]; // courses_avg
			let SearchID = maps[searchKey.substring(searchKey.indexOf("_") + 1)]; // avg
			let total = new Decimal(0);
			let uniqueSet = new Set();
			let avg;
			let sum = 0;
			switch (sortKey) {
				case "MAX":
					return Math.max(...results.map(function (o) {
						return o[SearchID];
					}));
				case "MIN":
					return Math.min(...results.map(function (o) {
						return o[SearchID];
					}));

				case "AVG":
					for (let result of results) {
						let dec = new Decimal(result[SearchID]);
						total = total.add(dec);
					}
					avg = total.toNumber() / results.length;
					return Number(avg.toFixed(2));

				case "SUM":
					for (let result of results) {
						sum = sum + result[SearchID];
					}
					return Number(sum.toFixed(2));
				default: // COUNT
					for (let s of results) {
						uniqueSet.add(s[SearchID]);
					}
					return uniqueSet.size;
			}
		}
	}
}

function group(groupKeys: any[], sections: any[], oldSections: any[], columns: any,query: any, index: any, keyNum: any){
	let currOnly: any[] = [];
	let key = groupKeys[index];
	let filterValueSearchID = key.substring(key.indexOf("_") + 1); // title
	let searchIDInData = maps[filterValueSearchID];
	let checked: any[] = [];
	let results: any[] = [];
	for (let s of sections) {
		if (!checked.includes(s[searchIDInData])) {
			currOnly = sections.filter((item) => item[searchIDInData] === s[searchIDInData]);
			if (keyNum !== 1) {
				results = results.concat(group(groupKeys, currOnly, oldSections,
					columns, query, index + 1, keyNum - 1));
				checked.push(s[searchIDInData]);
			} else {
				let result: any = {};
				for (let column of columns) {
					if (column.includes("_")) {
						let fID = column.substring(column.indexOf("_") + 1);
						let sData = maps[fID];
						result[column] = s[sData];
					} else {
						result[column] = ApplyCalculate(oldSections, column, query.TRANSFORMATIONS, currOnly);
					}
				}
				results.push(result);
				checked.push(s[searchIDInData]);
			}
		}
	}
	return results;
}

