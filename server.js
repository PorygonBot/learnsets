const express = require('express');
const { Dex } = require('@pkmn/dex');
const { Generations } = require('@pkmn/data');

const app = express();
const gens = new Generations(Dex);
const gen8 = gens.get(8);
const gen7 = gens.get(7);

const getLearnset = async (mon) => {
	if (!mon.prevo) {
		let curLearnset = (await gen8.learnsets.get(mon.name)) || (await gen7.learnsets.get(mon.name));
		return Object.keys(curLearnset.learnset);
	}

	let curLearnset = Object.keys(
		((await gen8.learnsets.get(mon.name)) || (await gen7.learnsets.get(mon.name))).learnset
	);
	console.log(curLearnset);
	let newLearnset = await getLearnset(gen8.species.get(mon.prevo) || gen7.species.get(mon.prevo));
	curLearnset.push(...newLearnset);

	return curLearnset;
};

const learnset = async (name) => {
	let mon = gen8.species.get(name) || gen7.species.get(name);
	const finalLearnset = await getLearnset(mon);

	return finalLearnset;
};

app.get('/', (req, res) => {
	res.send(
		'This is the home of learnsets. To get the learnset of a mon, put the name of a pokemon (lowercase) after the forward slash in the url.'
	);
});

app.get('/:name', async (req, res) => {
	const name = req.params.name;
	if (name !== 'favicon.ico') {
		const learnsetMon = await learnset(name);

		res.json(learnsetMon);
	}
});

app.listen(process.env.port);
