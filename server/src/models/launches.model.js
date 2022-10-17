
const axios = require('axios');

//let latestFlightNumber = 100;
const DEFAULT_FLIGHT_NUMBER =100;

/*
const launch={
    mission:'Kepler Exploration X', //name
    rocket:'Explorer ISI', //rocket.name
    launchDate: new Date('December 27,2030'), // date_local
    target:'Kepler-442 b', //not applicable
    flightNumber:100, //flight_numner
    customers:['ZTM','NASA'], // payloads.customers for each payload
    upcoming:true, // upcoming
    success:'true' //success
};
*/

const planets = require('./planets.mongo');
const launchesDatabase = require('./launches.mongo');
//saveLaunch(launch);

//const launches = new Map();
//launches.set(launch.flightNumber,launch);
//launches.get(100) == launch;
const SPACEX_API_URL='https://api.spacexdata.com/v4/launches/query';

async function populateLaunches()
{
    const response = await axios.post(SPACEX_API_URL,{
        query: {},
        options:{
            pagination: false,
            populate:[
                {
                    path: 'rocket',
                    select:{
                        name:1
                    }
                },
                {
                    path:'payloads',
                    select:{
                        'customers':1
                    }
                }
            ]
        }
    });


    if(response.status != 200)
    {
        console.log('Problem downloading Launch Data');
        throw new Error('SpaceX Launch Data download failed');
    }

    const launchDocs = response.data.docs;
    for(const launchDoc of launchDocs)
    {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload)=> {
            return payload['customers'];
        });
        const launch ={
            flightNumber: launchDoc['flight_number'],
            mission:launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers,
        };

        console.log(`${launch.flightNumber} ${launch.mission}`);

        // populate Launches Collection.
        await saveLaunch(launch);

    }

}

async function loadLaunchesData(){

    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });

    if(firstLaunch)
    {
        console.log('SpaceX Launch Data is already loaded');
    }
    else{
        console.log('Downloading launches - spaceX API.');
        await populateLaunches();
    }

}

async function findLaunch(filter)
{
    return await launchesDatabase.findOne(filter);
}

async function existLaunchWithId(launchId)
{  //return launches.has(launchId);
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getlatestFlightNumber()
{
    const latestLaunch = await launchesDatabase
        .findOne({})
        .sort('-flightNumber');
    if(!latestLaunch)
    {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip,limit)
{
    //return Array.from(launches.values());    
    return await launchesDatabase
    .find({},{
        '_id':0,'__v':0
    })
    .sort({flightNumber: 1})
    .skip(skip)
    .limit(limit);
}


async function saveLaunch(launch){

    await launchesDatabase.findOneAndUpdate({
        flightNumber:launch.flightNumber,
    },launch,{
        upsert:true
    })
} 

async function scheduleNewLaunch(launch)
{

    const planet = await planets.findOne({
        keplerName:launch.target
    });
    
    if(!planet) {
        throw new Error('No matching planet found');
    }

    const newFlightNumber = await getlatestFlightNumber()+1;
    const newLaunch = Object.assign(launch,{
        success: true,
        upcoming: true,
        customers: ['Zero to mastery','NASA'],
        flightNumber: newFlightNumber
    });

    await saveLaunch(newLaunch);
}

/*
function addNewLaunch(launch)
{
    console.log(JSON.stringify(launch));
    latestFlightNumber++;
   
    launches.set(
        latestFlightNumber,Object.assign(launch,{
            customers:['Zero to mastery','NASA'],
            flightNumber:latestFlightNumber,
            upcoming:true,
            success:true
        })
    );

    console.log(JSON.stringify(launches.values()));
}
*/

async function abortLaunchById(launchId)
{
    //const aborted = launches.get(launchId);
    //aborted.upcoming= false;
    //aborted.success= false;
    //return aborted;

    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId
    },{
       upcoming: false,
       success: false 
    });
    return aborted;
    //return aborted.ok ===1 && aborted.nModified === 1;
}

module.exports ={
    existLaunchWithId,
    abortLaunchById,
    //addNewLaunch,
    scheduleNewLaunch,
    getAllLaunches,
    loadLaunchesData
};