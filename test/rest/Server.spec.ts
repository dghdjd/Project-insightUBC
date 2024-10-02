import Server from "../../src/rest/Server";
import {expect, use} from "chai";
import chaiHttp from "chai-http";
import Log from "@ubccpsc310/folder-test/build/Log";
import chai = require("chai");
import * as fs from "fs-extra";


describe("Facade D3", function () {
	let server: Server;
	use(chaiHttp);

	before(function () {
		server = new Server(4321);
		// TODO: start server here once and handle errors properly
		try {
			server.start();
			Log.info("Server has started");
		} catch (e) {
			Log.error("Server not started");
		}
	});

	after(function () {
		// TODO: stop server here once!
		server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		Log.info("test has started");
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what"s going on
		Log.info("test has ended");
	});


	it("PUT test for valid courses dataset: 200", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL = "/dataset/courses/courses";
		let data = "./test/resources/archives/courses.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected: string[] = ["courses"];
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					Log.info("we have reached here");
					Log.info(res.body.result);
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal(expected);
				})
				.catch(function (err) {
					Log.info(err);
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("PUT test for valid rooms dataset: 200", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL = "/dataset/rooms/rooms";
		let data = "./test/resources/archives/rooms.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected: string[] = ["rooms"];
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					Log.info("we have reached here");
					Log.info(res.body.result);
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.deep.equal(expected);
				})
				.catch(function (err) {
					Log.info(err);
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("PUT test for invalid courses dataset: 400", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL = "/dataset/courses/courses";
		let data = "./test/resources/archives/emptyZip.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected: string = "InsightFacade.addDataset() rejects";
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					Log.info("res status: " + res.status);
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					Log.info("Should not reach here");
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("PUT test for invalid rooms dataset: 400", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL = "/dataset/roomsWithNoBuildingFolder/rooms";
		let data = "./test/resources/archives/invalidDirectory.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: ChaiHttp.Response) {
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("list datasets", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL = "/datasets";
		try {
			return chai
				.request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res: ChaiHttp.Response) {
					Log.info("we have reached here");
					expect(res.status).to.equal(200);
				})
				.catch((err) => {
					Log.info(err);
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("DELETE test for courses dataset", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL1 = "/dataset/courses/courses";
		let ENDPOINT_URL2 = "/dataset/courses";
		let data = "./test/resources/archives/courses.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected1: string[] = ["courses"];
		let expected2 = "courses";
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL1)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res1: ChaiHttp.Response) {
					expect(res1.status).to.be.equal(200);
					expect(res1.body.result).to.deep.equal(expected1);
					return chai.request(SERVER_URL)
						.del(ENDPOINT_URL2)
						.then(function (res: ChaiHttp.Response) {
							expect(res.status).to.be.equal(200);
							expect(res.body.result).to.be.equal(expected2);
						})
						.catch(function (err) {
							Log.info(err);
							expect.fail();
						});
				})
				.catch(function (err) {
					Log.info(err);
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("DELETE test for rooms dataset", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL1 = "/dataset/rooms/rooms";
		let ENDPOINT_URL2 = "/dataset/rooms";
		let data = "./test/resources/archives/rooms.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected1: string[] = ["rooms"];
		let expected2 = "rooms";
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL1)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res1: ChaiHttp.Response) {
					expect(res1.status).to.be.equal(200);
					expect(res1.body.result).to.deep.equal(expected1);
					return chai.request(SERVER_URL)
						.del(ENDPOINT_URL2)
						.then(function (res: ChaiHttp.Response) {
							expect(res.status).to.be.equal(200);
							expect(res.body.result).to.be.equal(expected2);
						})
						.catch(function (err) {
							Log.info(err);
							expect.fail();
						});
				})
				.catch(function (err) {
					Log.info(err);
					expect.fail();
				});
		} catch (err) {
			Log.info(err);
		}
	});

	it("POST request with valid query", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL1 = "/dataset/courses/courses";
		let ENDPOINT_URL2 = "/query";
		let data = "./test/resources/archives/courses.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected: any[] = [];
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL1)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/json")
				.then(function (res1) {
					let query = {
						WHERE: {
							GT: {
								courses_avg: 100,
							},
						},
						OPTIONS: {
							COLUMNS: ["courses_dept", "courses_id", "courses_avg"],
							ORDER: "courses_avg",
						},
					};
					return chai
						.request(SERVER_URL)
						.post(ENDPOINT_URL2)
						.send(query)
						.set("Content-Type", "application/json")
						.then(function (res) {
							expect(res.status).to.be.equal(200);
							expect(res.body.result).to.deep.equal(expected);
						})
						.catch((err) => {
							Log.trace(err);
							expect.fail();
						});
				});
		} catch (err) {
			Log.trace(err);
		}
	});

	it("POST request with invalid query", function () {
		let SERVER_URL = "http://localhost:4321";
		let ENDPOINT_URL1 = "/dataset/courses/courses";
		let ENDPOINT_URL2 = "/query";
		let data = "./test/resources/archives/emptyZip.zip";
		let ZIP_FILE_DATA = fs.readFileSync(data);
		let expected: any[] = [];
		try {
			return chai
				.request(SERVER_URL)
				.put(ENDPOINT_URL1)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/json")
				.then(function (res1) {
					let query = {
						WHERE: {
							GT: {
								courses_avg: 100,
							},
						},
						OPTIONS: {
							COLUMNS: ["courses_dept", "courses_id", "courses_avg"],
							ORDER: "courses_avg",
						},
					};
					return chai
						.request(SERVER_URL)
						.post(ENDPOINT_URL2)
						.send(query)
						.set("Content-Type", "application/json")
						.then(function (res) {
							expect(res.status).to.be.equal(400);
						})
						.catch((err) => {
							Log.trace(err);
							expect.fail();
						});
				});
		} catch (err) {
			Log.trace(err);
		}
	});
	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
