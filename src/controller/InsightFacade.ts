import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {isQueryValid} from "./ValidQuery";
import * as fs from "fs-extra";
import {
	andOperation,
	doesDatasetExist,
	negation,
	orOperation,
	sComparison,
} from "./performQueryHelper";
import {extractAllJsonFiles, extractAllRoomSections, findValidCourseSections} from "./AddDatasetHelpers";
import {ColumnsAndSort} from "./ExtractColumns";
import {ifTrans} from "./ValidQueryTrans";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export let addedData: any = {};
let columns: any;
let datasetID: any;
let results: any[];
export default class InsightFacade implements IInsightFacade {
	public addedDataset: InsightDataset[];
	public addedDatasetId: string[];

	constructor() {
		this.addedDataset = [];
		this.addedDatasetId = [];
		console.log("InsightFacadeImpl::init()");
	}

	private saveDataIntoDisk(roomsOrCourses: any[], id: string, kind: InsightDatasetKind) {
		if (roomsOrCourses.length > 0) {
			this.addedDatasetId.push(id);
			this.addedDataset.push({id, kind, numRows: roomsOrCourses.length});
			addedData[id] = kind;
			if (!fs.existsSync("./data")) {
				fs.mkdirSync("./data");
			}
			let dataToBeWritten: any = {};
			dataToBeWritten.result = roomsOrCourses;
			try {
				fs.writeFileSync("data/" + id, JSON.stringify(dataToBeWritten));
				return 1;
			} catch (error) {
				return 0;
			}
		} else {
			return -1;
		}
	}

	public processRoomDateset(id: string, content: string): Promise<string[]> {
		return new Promise((resolve, reject) => {
			let zip = new JSZip();
			zip.loadAsync(content, {base64: true})
				.then((zipContent) => {
					if (Object.values(zipContent.files)[0].name !== "rooms/") {
						return reject(new InsightError("Does not have rooms folder"));
					}
					let index = zipContent.file("rooms/index.htm");
					extractAllRoomSections(id, zip, index)
						.then((allRoomSections) => {
							if (this.saveDataIntoDisk(allRoomSections, id, InsightDatasetKind.Rooms) === 1) {
								return resolve(this.addedDatasetId);
							} else {
								return reject(
									new InsightError("Write file unsuccessful or " + "No valid sections in the dataset")
								);
							}
						})
						.catch((error1) => {
							return reject(error1);
						});
				})
				.catch((error2) => {
					return reject(new InsightError(error2));
				});
		});
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		return new Promise((resolve, reject) => {
			// check if id is only whitespace, undefined, or contains underscore
			if (!id.trim() || id === undefined || id.indexOf("_") !== -1) {
				return reject(new InsightError("id is invalid"));
			}
			// check if the dataset with id already exists
			if (this.addedDatasetId.includes(id)) {
				return reject(new InsightError("The dataset already exist"));
			}
			// check the kind of dataset
			if (kind === InsightDatasetKind.Rooms) {
				this.processRoomDateset(id, content)
					.then((result) => {
						return resolve(result);
					})
					.catch((error) => {
						return reject(error);
					});
			} else if (kind === InsightDatasetKind.Courses) {
				let zip = new JSZip();
				// Load a zip file
				zip.loadAsync(content, {base64: true})
					.then((zipContent) => {
						// check if the folder is named "courses"
						if (Object.values(zipContent.files)[0].name !== "courses/") {
							return reject(new InsightError("Does not have courses folder"));
						}
						// push all Promises of file.async to jsonFileLists
						let jsonFileLists: Array<Promise<string>> = [];
						extractAllJsonFiles(zipContent, zip, jsonFileLists);
						Promise.all(jsonFileLists)
							.then((files: any[]) => {
								// check the format of every json file and add all valid sections into validSections
								let validSections: any[] = findValidCourseSections(files);
								if (this.saveDataIntoDisk(validSections, id, kind) === 1) {
									return resolve(this.addedDatasetId);
								} else {
									return reject(
										new InsightError(
											"Write file unsuccessful or " + "No valid sections in the dataset"
										)
									);
								}
							})
							.catch((error1) => {
								return reject(new InsightError(error1));
							});
					})
					.catch((error2) => {
						return reject(new InsightError(error2));
					});
			} else {
				return reject(new InsightError("Wrong kind"));
			}
		});
	}

	public removeDataset(id: string): Promise<string> {
		return new Promise((resolve, reject) => {
			// check if id is only whitespace, undefined, or contains underscore
			if (!id.trim() || id === undefined || id === null || id.includes("_")) {
				return reject(new InsightError("id is invalid"));
			}
			try {
				let index: number = this.addedDatasetId.indexOf(id);
				if (index !== -1) {
					delete this.addedDatasetId[index];
					this.addedDataset.filter((dataset) => {
						return dataset.id !== id;
					});
					let dir: string = "./data/" + id;
					if (fs.existsSync(dir)) {
						fs.unlinkSync(dir);
					}
					return resolve(id);
				} else {
					reject(new NotFoundError("id is not added"));
				}
			} catch (e) {
				return reject(new InsightError());
			}
		});
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return new Promise<InsightDataset[]>((resolve) => {
			return resolve(this.addedDataset);
		});
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		isQueryValid(query);
		doesDatasetExist(this.addedDatasetId);

		return new Promise((resolve, reject) => {
			let tempQuery = JSON.parse(JSON.stringify(query));
			InsightFacade.setVariable(tempQuery);
			// let data = fs.readFileSync("data/" + datasetID, {encoding: "utf8"});
			let data = this.validateRead(datasetID);
			if (!data) {
				return reject(new InsightError("File is not yet on the disk!"));
			}
			let firstOperation = Object.keys(tempQuery.WHERE)[0];
			let allSections: any[] = JSON.parse(data).result;
			columns = tempQuery.OPTIONS["COLUMNS"];
			if (Object.keys(tempQuery.WHERE).length === 0) {
				if (allSections.length > 5000 && !ifTrans) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				results = ColumnsAndSort(allSections, columns,tempQuery.OPTIONS["ORDER"],tempQuery);
				if (results.length > 5000) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				return resolve(results);
			} else {
				results = InsightFacade.switchHelper(firstOperation, tempQuery, allSections, reject);
				if (results.length > 5000) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				return resolve(results);
			}
		});
	}

	private static setVariable (tempQuery: any) {
		if (ifTrans) {
			columns = tempQuery.TRANSFORMATIONS["GROUP"];
			datasetID = columns[0].substring(0, columns[0].indexOf("_"));
		} else {
			columns = tempQuery.OPTIONS["COLUMNS"];
			datasetID = columns[0].substring(0, columns[0].indexOf("_"));
		}
	}

	private static switchHelper(firstOperation: any, tempQuery: any, allSections: any[], reject: any) {
		switch (firstOperation) {
			case "OR": {
				let sectionsOr = orOperation(tempQuery.WHERE, allSections);
				if (orOperation(tempQuery.WHERE, allSections).length > 5000 && !ifTrans) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				results = ColumnsAndSort(sectionsOr, columns,tempQuery.OPTIONS["ORDER"],tempQuery);
				break;
			}
			case "AND": {
				let sectionsAnd = andOperation(tempQuery.WHERE, allSections);
				if (sectionsAnd.length > 5000 && !ifTrans) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				results = ColumnsAndSort(sectionsAnd, columns,tempQuery.OPTIONS["ORDER"],tempQuery);
				break;
			}
			case "NOT": {
				let sectionsNot = negation(tempQuery.WHERE, allSections);
				if (sectionsNot.length > 5000 && !ifTrans) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				results = ColumnsAndSort(sectionsNot, columns, tempQuery.OPTIONS["ORDER"],tempQuery);
				break;
			}
			default: {
				let sections = sComparison(tempQuery.WHERE, allSections);
				if (sections.length > 5000 && !ifTrans) {
					return reject(new ResultTooLargeError("results is too large"));
				}
				results = ColumnsAndSort(sections, columns, tempQuery.OPTIONS["ORDER"],tempQuery);
				break;
			}
		}
		return results;
	}

	private validateRead(ID: string) {
		try {
			let data = fs.readFileSync("data/" + ID, {encoding: "utf8"});
			// if came to here, then valid
			return data;
		} catch(e) {
			return null;
		}
	}
}
