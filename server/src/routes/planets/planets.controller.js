const {getAllPlanets} = require('../../models/planets.model');


async function httpGetAllPlanets(req,res){
  console.log('get all planets - 1');
  return  res.status(200).json(await getAllPlanets());
}

module.exports={
    httpGetAllPlanets
};