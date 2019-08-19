const express = require("express");

const app = express();
const bodyparser = require("body-parser");

const http = require('http');
const cors = require('cors')

const hltb = require('howlongtobeat');
const {getGamesAmerica, getGamesEurope, getGamesJapan} = require('nintendo-switch-eshop');


const port = process.env.PORT || 3200;

const orders = [];

let hltbService = new hltb.HowLongToBeatService();

// Server

app.use(cors());
app.use(bodyparser.json()); // Parses json, multi-part (file), url-encoded
app.use(bodyparser.urlencoded({extended: false}));


// Middleware

// How Long To Beat

app.get("/search-hltb", (request, response, next) => {

	hltbService.search(request.query.search)
		.then(result => {
			response.status(200).send(result);
		})
		.catch(error =>
			next(error)
		);
});

app.get("/get-hltb", (request, response, next) => {

	hltbService.detail(request.query.gameId)
		.then(result => {
			response.status(200).send(result);
		})
		.catch(error =>
			next(error)
		);
});

// Nintendo Switch Games

app.get("/get-games", (request, response) => {
	// response.status(200).send('OK');

	const req = http.get('http://search.nintendo-europe.com/en/select?fq=type%3AGAME%20AND%20system_type%3Anintendoswitch*%20AND%20product_code_txt%3A*&q=*&rows=9999&sort=sorting_title%20asc&start=0&wt=json', (resp) => {
		let data = '';

		// A chunk of data has been received.
		resp.on('data', (chunk) => {
			data += chunk;
		});

		// The whole response has been received. Print out the result.
		resp.on('end', () => {
			console.log(data);
			console.log(JSON.parse(data).explanation);
			response.status(200).send(data);
		});

	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
});

app.get("/get-games-europe", (request, response, next) => {

	getGamesEurope().then(result =>
		response.status(200).send(result)
	).catch(error =>
		next(error)
	);
});

app.post("/new_order", (req, res) => {
	const order = req.body;
	console.log(order);
	if (order.food_name && order.customer_name && order.food_quantity) {
		orders.push({
			...order,

			id: `${orders.length + 1}`,

			date: Date.now().toString()
		});

		res.status(200).json({
			message: "Order created successfully"
		});
	} else {
		res.status(401).json({
			message: "Invalid Order creation"
		});
	}
});

app.get("/get_orders", (req, res) => {
	res.status(200).send(orders);
});

app.patch("/order/:id", (req, res) => {
	const order_id = req.params.id;

	const order_update = req.body;

	for (let order of orders) {
		if (order.id === order_id) {
			if (order_update.food_name != null || undefined)
				order.food_name = order_update.food_name;

			if (order_update.food_quantity != null || undefined)
				order.food_quantity = order_update.food_quantity;

			if (order_update.customer_name != null || undefined)
				order.customer_name = order_update.customer_name;

			return res
				.status(200)
				.json({message: "Updated Succesfully", data: order});
		}
	}

	res.status(404).json({message: "Invalid Order Id"});
});

app.delete("/order/:id", (req, res) => {
	const order_id = req.params.id;

	for (let order of orders) {
		if (order.id === order_id) {
			orders.splice(orders.indexOf(order), 1);

			return res.status(200).json({
				message: "Deleted Successfully"
			});
		}
	}

	res.status(404).json({message: "Invalid Order Id"});
});

app.listen(port, () => {
	console.log(`running at port ${port}`);
});
