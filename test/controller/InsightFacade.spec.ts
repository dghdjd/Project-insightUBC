import {
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import * as fs from "fs-extra";

import {folderTest} from "@ubccpsc310/folder-test";
import {expect} from "chai";

describe("InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
		under_courses: "./test/resources/archives/under_score.zip",
		whitespace: "./test/resources/archives/.zip",
		emptyContent: "./test/resources/archives/emptyContent.zip",
		emptyDataset: "./test/resources/archives/emptyDataset.zip",
		emptyZip: "./test/resources/archives/emptyZip.zip",
		invalidDirectory: "./test/resources/archives/invalidDirectory.zip",
		notJsonFile: "./test/resources/archives/notJsonFile.zip",
		notZip: "./test/resources/archives/notZip.txt",
		rooms: "./test/resources/archives/rooms.zip",
		roomWithIncorrectName: "./test/resources/archives/roomWithIncorrectName.zip",
		noIndexHTML: "./test/resources/archives/noIndexHTML.zip",
		roomWithNoBuildings: "./test/resources/archives/roomWithNoBuildings.zip",
		roomWithNoDiscover: "./test/resources/archives/roomWithNoDiscover.zip",
		roomWithNoBuildingFolder: "./test/resources/archives/roomWithNoBuildingFolder.zip",
		roomWithNoCampusFolder: "./test/resources/archives/roomWithNoCampusFolder.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDir);
		});

		// tests for room
		it("Should add a valid room dataset", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});

		it("should add a rooms and a courses", function () {
			const id1: string = "rooms";
			const id2: string = "courses";
			const content1: string = datasetContents.get("rooms") ?? "";
			const content2: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id1, id2];
			return insightFacade
				.addDataset(id1, content1, InsightDatasetKind.Rooms)
				.then(() => {
					return insightFacade.addDataset(id2, content2, InsightDatasetKind.Courses);
				})
				.then((result: string[]) => {
					expect(result).to.deep.equal(expected);
				})
				.catch((err: any) => {
					expect.fail(err, expected, "Should not have rejected");
				});
		});

		it("Should not add room with no index.html", function () {
			const id: string = "noIndexHTML";
			const content: string = datasetContents.get("noIndexHTML") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add room with incorrect room folder name", function () {
			const id: string = "roomWithIncorrectName";
			const content: string = datasetContents.get("roomWithIncorrectName") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add room with no room folder", function () {
			const id: string = "emptyZip";
			const content: string = datasetContents.get("emptyZip") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add a room with no buildings", function () {
			const id: string = "roomWithNoBuildings";
			const content: string = datasetContents.get("roomWithNoBuildings") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add a room with discover folder", function () {
			const id: string = "roomWithNoDiscover";
			const content: string = datasetContents.get("roomWithNoDiscover") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add a room with building folder", function () {
			const id: string = "roomWithNoBuildingFolder";
			const content: string = datasetContents.get("roomWithNoBuildingFolder") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add a room with campus folder", function () {
			const id: string = "roomWithNoCampusFolder";
			const content: string = datasetContents.get("roomWithNoCampusFolder") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not remove rooms dataset that is not added yet", function () {
			const id: string = "rooms";
			return insightFacade.removeDataset(id).catch((result) => {
				expect(result).to.be.instanceOf(NotFoundError);
			});
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});

		it("id should not be empty", function () {
			const id: string = "";
			const content: string = datasetContents.get("whitespace") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("Should not add a dataset with id have underscore", function () {
			const id: string = "under_courses";
			const content: string = datasetContents.get("under_courses") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("id should not be the same as the id of an already added dataset", function () {
			const id1: string = "courses";
			const id2: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset(id1, content, InsightDatasetKind.Courses).then(() => {
				return insightFacade.addDataset(id2, content, InsightDatasetKind.Courses).catch((result) => {
					expect(result).to.be.instanceOf(InsightError);
				});
			});
		});

		it("dataset should not be empty", function () {
			const id: string = "emptyDataset";
			const content: string = datasetContents.get("emptyDataset") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("content is not a zip file", function () {
			const id: string = "notZip";
			const content: string = datasetContents.get("notZip") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("directory could not have invalid name", function () {
			const id: string = "invalidDirectory";
			const content: string = datasetContents.get("invalidDirectory") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("not a valid json file", function () {
			const id: string = "notJsonFile";
			const content: string = datasetContents.get("notJsonFile") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("should not add an empty zip", function () {
			const id: string = "emptyZip";
			const content: string = datasetContents.get("emptyZip") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).catch((result) => {
				expect(result).to.be.instanceOf(InsightError);
			});
		});

		it("should be able to remove an existing courses dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then(() => {
				return insightFacade.removeDataset(id).then((result) => {
					expect(result).to.equal(id);
				});
			});
		});

		it("Should remove an existing rooms dataset", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			let dir: string = "./data";
			insightFacade
				.addDataset(id, content, InsightDatasetKind.Courses)
				.then(() => {
					return insightFacade.removeDataset(id);
				})
				.catch(() => {
					expect.fail("should not reach here");
				})
				.then((result) => {
					expect(result).to.equal(expected);
					if (fs.existsSync(dir.concat("/" + id))) {
						expect.fail("should not reach here");
					}
				});
		});

		it("should remove valid dataset", function () {
			const id1: string = "courses";
			const content1: string = datasetContents.get("courses") ?? "";
			const id2: string = "courses2";
			const content2: string = datasetContents.get("courses2") ?? "";
			const expected: string[] = [id1];
			let dir: string = "./data";
			insightFacade
				.addDataset(id1, content1, InsightDatasetKind.Courses)
				.then(() => {
					insightFacade.addDataset(id2, content2, InsightDatasetKind.Courses);
				})
				.then(() => {
					return insightFacade.removeDataset(id1);
				})
				.catch(() => {
					expect.fail("should not reach here");
				})
				.then((result) => {
					expect(result).to.equal(expected);
					if (fs.existsSync(dir.concat("/" + id1))) {
						expect.fail("should not reach here");
					}
				});
		});

		it("should not remove a non-existing dataset", function () {
			const id: string = "courses";
			return insightFacade.removeDataset(id).catch((result) => {
				expect(result).to.be.instanceOf(NotFoundError);
			});
		});

		it("should return nothing after adding 0 dataset", async function () {
			const result = await insightFacade.listDatasets();
			expect(result).to.deep.equal([]);
		});

		it("should return every dataset after adding 1 dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset(id, content, InsightDatasetKind.Courses)
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					return expect(insightDatasets).to.have.length(1);
				});
		});

		it("should return every dataset after adding 2 datasets", function () {
			const id1: string = "courses";
			const id2: string = "courses2";
			const content1: string = datasetContents.get("courses") ?? "";
			const content2: string = datasetContents.get("courses2") ?? "";
			insightFacade
				.addDataset(id1, content1, InsightDatasetKind.Courses)
				.then(() => {
					insightFacade.addDataset(id2, content2, InsightDatasetKind.Courses);
				})
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(2);
				});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
				insightFacade.addDataset("rooms", datasetContents.get("rooms") ?? "", InsightDatasetKind.Rooms),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";
		// type input = unknown;
		// type output = Promise<InsightResult[]>;

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(Input) => insightFacade.performQuery(Input),
			"./test/resources/queries",
			{
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError: (actual, expected) => {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});
