const {getAllLaunches,
  //addNewLaunch,
  scheduleNewLaunch,
  existLaunchWithId,
  abortLaunchById
} = require('../../models/launches.model');
const launchesRouter = require('./launches.router');

const {
  getPagination,
} = require('../../services/query');

async function httpGetAllLaunches(req,res){
  console.log('get all launches - 2');
  //console.log(req.query);
  const {skip,limit} = getPagination(req.query);
  const launches = await getAllLaunches(skip,limit);
  return  res.status(200).json(launches);
}

async function httpAddNewLaunch(req,res){
  const launch = req.body;

  if(!launch.mission || !launch.rocket || !launch.launchDate 
    || !launch.target){
      return res.status(400).json({
        error: 'Missing required launch property'
      });
    }
   
  launch.launchDate = new Date(launch.launchDate);
  if(isNaN(launch.launchDate)){
    return res.status(400).json({
      error:'Invalid launch date'
    });
  }
  console.log('httpAddNewLaunch' +1);
  scheduleNewLaunch(launch);

  return res.status(201).json(launch);
}

async function httpAbortLaunch(req,res){
  
  const launchId = Number(req.params.id);
  console.log(`Abort launch ${launchId}`);
  //if launch doesnot exit return 404
  const existsLaunch = await existLaunchWithId(launchId);
  if(!existsLaunch)
  {
    return res.status(404).json({
      error:'Launch not found'
    });
  }
  // if launch does exit then delete
  const aborted = await abortLaunchById(launchId);
  if(!aborted){
    return res.status(400).json({
      error: 'Launch not aborted'
    });
  }
  return  res.status(200).json({
    ok: true
  });
}


module.exports={
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch
};