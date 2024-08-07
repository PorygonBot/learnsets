import express, { type Request, type Response } from "express";
import { Dex, type GenerationNum } from "@pkmn/dex";
import { Generations } from "@pkmn/data";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const gens = new Generations(Dex);
const NUM_GENERATIONS: GenerationNum = 9;

const getLearnset = async (pokemonName: string, formeLevel: number = 0) => {
    let learnset = new Set<string>();

    for (let i: GenerationNum = 1; i <= NUM_GENERATIONS; i++) {
        const gen = gens.get(i);

        let pokemon = gen.species.get(pokemonName);
        if (!pokemon) continue;

        if (pokemon.changesFrom) {
            const learnsetChangesFrom = await getLearnset(
                pokemon.changesFrom,
                formeLevel + 1
            );
            if (learnsetChangesFrom) {
                learnsetChangesFrom.forEach((move) => learnset.add(move));
            }
        }

        const learnsetMon = await gen.learnsets.get(pokemonName);
        if (!(learnsetMon && learnsetMon.learnset)) continue;

        Object.keys(learnsetMon.learnset).forEach((move) => learnset.add(move));

        if (pokemon.prevo) {
            const learnsetPrevo = await getLearnset(pokemon.prevo);
            if (!learnsetPrevo) continue;
            learnsetPrevo.forEach((move) => learnset.add(move));
        }
    }

    return learnset;
};

// Home. Doesn't do anything.
app.get("/", (req: Request, res: Response) => {
    res.send(
        "This is the home of learnsets. To get the learnset of a mon, put the name of a pokemon (lowercase) after the forward slash in the url."
    );
});

// URL slug to get the name of the Pokemon
app.get("/:pokemon", async (req, res) => {
    const pokemon = req.params.pokemon;
    if (pokemon !== "favicon.ico") {
        const learnsetMon = await getLearnset(pokemon);

        console.log("Got learnset for: " + pokemon);

        res.json(Array.from(learnsetMon));
    }
});

app.listen(process.env.PORT, () => {
    console.log("Listening on " + process.env.PORT);
});
