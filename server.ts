import express, { type Request, type Response } from "express";
import { Dex, type GenerationNum } from "@pkmn/dex";
import { Generations } from "@pkmn/data";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const gens = new Generations(Dex);
const NUM_GENERATIONS: GenerationNum = 9;
const gen8 = gens.get(8);
const gen7 = gens.get(7);

const getLearnset2 = async (pokemonName: string) => {
    let learnset = new Set<string>();
    for (let i: GenerationNum = 1; i <= NUM_GENERATIONS; i++) {
        const gen = gens.get(i);

        const pokemon = gen.species.get(pokemonName);
        if (!pokemon) continue;

        const learnsetMon = await gen.learnsets.get(pokemonName);
        if (!(learnsetMon && learnsetMon.learnset)) continue;

        Object.keys(learnsetMon.learnset).forEach((move) => learnset.add(move));

        console.log(learnset);

        if (pokemon.prevo) {
            const learnsetPrevo = await getLearnset2(pokemon.prevo);
            if (!learnsetPrevo) continue;
            learnsetPrevo.forEach((move) => learnset.add(move));
        }

        console.log(learnset);

        pokemon.formes?.forEach(async (forme) => {
            const learnsetForme = await getLearnset2(forme);
            if (learnsetForme)
                learnsetForme.forEach((move) => learnset.add(move));
        });

        console.log(learnset);
    }

    return learnset;
};

// /**
//  * Recursive function to get the learnset of a Pokemon and all its pre-evolutions and different forms.
//  * @param {string} pokemon The Pokemon to get the learnset of.
//  * @returns A list containing all the moves the Pokemon can learn, including pre-evolutions and forms.
//  */
// const getLearnset = async (pokemon: Specie) => {
//     // Checks if this is the most basic evolution of this Pokemon's evolutionary line
//     if (!pokemon.prevo) {
//         // Current learnset of the pokemon
//         let curLearnset = Object.keys(
//             (
//                 (await gen8.learnsets.get(pokemon.name)) ||
//                 (await gen7.learnsets.get(pokemon.name))
//             ).learnset
//         );
//         //Getting other forms.
//         if (pokemon.changesFrom) {
//             let newLearnset = await getLearnset(
//                 gen8.species.get(pokemon.changesFrom) ||
//                     gen7.species.get(pokemon.changesFrom)
//             );
//             curLearnset.push(...newLearnset);
//         }

//         // Bottom-most recursive level, so returns.
//         return curLearnset;
//     }

//     let curLearnset = Object.keys(
//         (
//             (await gen8.learnsets.get(pokemon.name)) ||
//             (await gen7.learnsets.get(pokemon.name))
//         ).learnset
//     );
//     //Getting the prevolution
//     let newLearnset = await getLearnset(
//         gen8.species.get(pokemon.prevo) || gen7.species.get(pokemon.prevo)
//     );
//     curLearnset.push(...newLearnset);
//     //Getting other forms.
//     if (pokemon.changesFrom) {
//         newLearnset = await getLearnset(
//             gen8.species.get(pokemon.changesFrom) ||
//                 gen7.species.get(pokemon.changesFrom)
//         );
//         curLearnset.push(...newLearnset);
//     }

//     return curLearnset;
// };
// 
// /**
//  * Function to get the learnset of a given pokemon. All lowercase, different words separated by hyphens. Punctuation ignored.
//  * @param {string} pokemon The name of the Pokemon
//  * @returns An array containing all the moves that the Pokemon can learn.
//  */
// const learnset = async (pokemon: string) => {
//     // Not all Pokemon up to Gen 7 are in Gen 8, all Pokemon up to Gen 7 are in Gen 7.
//     let mon = gen8.species.get(pokemon) || gen7.species.get(pokemon);

//     if (!mon) return [];

//     const finalLearnset = await getLearnset(mon);

//     return finalLearnset;
// };

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
        const learnsetMon = await getLearnset2(pokemon);

        res.json(Array.from(learnsetMon));
    }
});

app.listen(process.env.PORT, () => {
    console.log("Listening on " + process.env.PORT);
});
