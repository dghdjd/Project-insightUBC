import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {
	InsightDatasetKind,
	InsightError,
	NotFoundError,
} from "../controller/IInsightFacade";
import Log from "@ubccpsc310/folder-test/build/Log";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private insightFacade: InsightFacade;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();
		this.insightFacade = new InsightFacade();
		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		this.express.use(express.static("./frontend/public"));
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", this.putHandler.bind(this));
		this.express.delete("/dataset/:id", this.deleteHandler.bind(this));
		this.express.post("/query", this.postHandler.bind(this));
		this.express.get("/datasets", this.getHandler.bind(this));
	}

	// allows one to submit a zip file that will be parsed and used for future queries.
	// The zip file content will be sent 'raw' as a buffer in the PUT's body,
	// and you will need to convert it to base64 server side.
	// Response Codes:
	// 200: When InsightFacade.addDataset() resolves.
	// 400: When InsightFacade.addDataset() rejects.
	//
	// Response Body:
	// {result: arr}: Where arr is the array returned by a resolved addDataset.
	// {error: err}: Where err is a string error message from a rejected addDataset. The specific string is not tested.
	private putHandler(req: Request, res: Response) {
		try {
			if(req === null || req === undefined || req.params === null ||
				req.params === undefined || req.body === null || req.body === undefined
			|| req.params.id === null || req.params.id === undefined
			|| req.params.kind === null || req.params.kind === undefined) {
				throw new InsightError();
			}
			let id: string = req.params.id;
			let buff = req.body as Buffer;
			let content: string = buff.toString("base64");
			let kind: string = req.params.kind;
			let datasetKind: InsightDatasetKind;
			if (kind === "courses") {
				datasetKind = InsightDatasetKind.Courses;
			} else if (kind === "rooms") {
				datasetKind = InsightDatasetKind.Rooms;
			} else {
				throw new InsightError();
			}
			this.insightFacade.addDataset(id, content, datasetKind).then((arr) => {
				Log.info("Server responding 200");
				res.status(200).json({result: arr});
			}).catch((err) => {
				Log.info("Server responding 400");
				res.status(400).json({error: "addDataset rejects"});
			});
		} catch (err) {
			res.status(400).json({error: "addDataset rejects"});
		}

	}

	// deletes the existing dataset stored.
	// This will delete both disk and memory caches for the dataset for the id
	// meaning that subsequent queries for that id should fail unless a new PUT happens first.
	//
	// Response Codes:
	// 200: When InsightFacade.removeDataset() resolves.
	// 400: When InsightFacade.removeDataset() rejects with InsightError.
	// 404: When InsightFacade.removeDataset() rejects with NotFoundError.
	//
	// Response Body:
	// {result: str}: Where str is the string returned by a resolved removeDataset.
	// {error: err}: Where err is a string error message from a rejected removeDataset. The specific string is not tested.
	private deleteHandler(req: Request, res: Response) {
		try {
			if (req === null || req === undefined || req.params === null ||
				req.params === undefined || req.params.id === null || req.params.id === undefined) {
				throw new InsightError();
			}
			let id: string = req.params.id;
			this.insightFacade
				.removeDataset(id)
				.then((str) => {
					console.log("we reach 200");
					res.status(200).json({result: str});
				}).catch((err) => {
					if (err instanceof InsightError) {
						console.log("we reach 400");
						res.status(400).json({error: "InsightError"});
					} else if (err instanceof NotFoundError) {
						console.log("we reach 404");
						res.status(404).json({error: "NotFoundError"});
					}
				});
		} catch (err) {
			res.status(400).json({error: "400 error"});
		}
	}

	// sends the query to the application. The query will be in JSON format in the POST's body.
	// Response Codes:
	// 200: When InsightFacade.performQuery() resolves.
	// 400: When InsightFacade.performQuery() rejects.
	//
	// Response Body:
	// {result: arr}: Where arr is the array returned by a resolved performQuery.
	// {error: err}: Where err is a string error message from a rejected performQuery. The specific string is not tested.
	private postHandler(req: Request, res: Response) {
		try{
			if (req.body === null || req.body === undefined) {
				throw new Error("");
			}
			let query = req.body;
			this.insightFacade
				.performQuery(query)
				.then((arr) => {
					res.status(200).json({result: arr});
				})
				.catch((err) => {
					res.status(400).json({error: "400 error"});
				});
		} catch (e) {
			res.status(400).json({error: "400 error"});
		}
	}

	// returns a list of datasets that were added.
	// Response Codes:
	// 200: When InsightFacade.listDatasets() resolves.
	//
	// Response Body:
	// {result: arr}: Where arr is the array returned by a resolved listDataset
	private getHandler(req: Request, res: Response) {
		try {
			this.insightFacade.listDatasets().then((arr) => {
				res.status(200).json({result: arr});
			}).catch((err) =>{
				res.status(400).json({error: "400 error"});
			});
		} catch(err) {
			res.status(400).json({err: "400 error"});
		}
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
