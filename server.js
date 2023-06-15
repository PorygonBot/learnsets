const express = require("express");
const { Dex } = require("@pkmn/dex");
const { Generations } = require("@pkmn/data");

const app = express();
const gens = new Generations(Dex);
const gen8 = gens.get(8);
const gen7 = gens.get(7);

/**
 * Recursive function to get the learnset of a Pokemon and all its pre-evolutions and different forms.
 * @param {string} pokemon The Pokemon to get the learnset of.
 * @returns A list containing all the moves the Pokemon can learn, including pre-evolutions and forms.
 */
const getLearnset = async (pokemon) => {
    // Checks if this is the most basic evolution of this Pokemon's evolutionary line
    if (!pokemon.prevo) {
        // Current learnset of the pokemon
        let curLearnset =
            Object.keys(((await gen8.learnsets.get(pokemon.name)) ||
            (await gen7.learnsets.get(pokemon.name))).learnset);
        //Getting other forms.
        if (pokemon.changesFrom) {
            let newLearnset = await getLearnset(
                gen8.species.get(pokemon.changesFrom) ||
                    gen7.species.get(pokemon.changesFrom)
            );
            curLearnset.push(...newLearnset);
        }

        // Bottom-most recursive level, so returns.
        return curLearnset;
    }

    let curLearnset = Object.keys(
        (
            (await gen8.learnsets.get(pokemon.name)) ||
            (await gen7.learnsets.get(pokemon.name))
        ).learnset
    );
    //Getting the prevolution
    let newLearnset = await getLearnset(
        gen8.species.get(pokemon.prevo) || gen7.species.get(pokemon.prevo)
    );
    curLearnset.push(...newLearnset);
    //Getting other forms.
    if (pokemon.changesFrom) {
        newLearnset = await getLearnset(
            gen8.species.get(pokemon.changesFrom) ||
                gen7.species.get(pokemon.changesFrom)
        );
        curLearnset.push(...newLearnset);
    }

    return curLearnset;
};

/**
 * Function to get the learnset of a given pokemon. All lowercase, different words separated by hyphens. Punctuation ignored.
 * @param {string} pokemon The name of the Pokemon
 * @returns An array containing all the moves that the Pokemon can learn.
 */
const learnset = async (pokemon) => {
    // Not all Pokemon up to Gen 7 are in Gen 8, all Pokemon up to Gen 7 are in Gen 7.
    let mon = gen8.species.get(pokemon) || gen7.species.get(pokemon);


    const finalLearnset = await getLearnset(mon);

    return finalLearnset;
};

// Home. Doesn't do anything.
app.get("/", (req, res) => {
    res.send(
        "This is the home of learnsets. To get the learnset of a mon, put the name of a pokemon (lowercase) after the forward slash in the url."
    );
});

// URL slug to get the name of the Pokemon
app.get("/:pokemon", async (req, res) => {
    const pokemon = req.params.pokemon;
    if (pokemon !== "favicon.ico") {
        const learnsetMon = await learnset(pokemon);

        res.json(learnsetMon);
    }
});

app.listen(process.env.PORT);
