const fs = require('fs');
const path = require('path');
const {parse} = require('csv-parse');

const planets = require('./planets.mongo');


function isHabitablePlanet(planet) {
  return planet['koi_disposition'] === 'CONFIRMED'
    && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11
    && planet['koi_prad'] < 1.6;
}

/*
const promise = new Promise((resolve,reject) =>{
    resolve(42);
});
promise.then ((result) => {

});

const result = await promise;
*/

function loadPlanetData(){
   return new Promise((resolve,reject) => {
        fs.createReadStream(path.join(__dirname,'..','..','data','kepler_data.csv'))
        .pipe(parse({
            comment: '#',
            columns: true
        }))
        .on('data', async (data) => {
            if (isHabitablePlanet(data)) {
                //habitablePlanets.push(data);
                // insert to mongo db
                // insert  + update -> upsert
                savePlanet(data);
            }
        })
        .on('error', (err) => {
            console.log(err);
            reject(err);
        })
        .on('end', async () => {

            /*
            console.log(habitablePlanets.map((planet) => {
            return planet['kepler_name'];
            }));
            */
            const countPlanetsFound = (await getAllPlanets()).length;
            console.log(`${countPlanetsFound} habitable planets found!`);
            resolve();
        });
   });

}

async function getAllPlanets()
{
    //return habitablePlanets;
     return await planets.find({},{
        '__v':0,
        '_id':0
    });
}

async function savePlanet(planet){

    try{
        await planets.updateOne({
            keplerName: planet.kepler_name
        },{
            keplerName: planet.kepler_name
        },{
            upsert: true
        });
    } catch(err) {
        console.error(`Could not save planet ${err}`);
    }



}

module.exports = {
    loadPlanetData,
    getAllPlanets
};
