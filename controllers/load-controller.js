const Load = require('../models/Load');
const Truck = require('../models/Truck');
const User = require('../models/User');

const {loadValidation} = require('../validations/load');

const truckDimensions = [
    {type: 'SPRINTER', dimensions: {length: 300, width: 250, height: 170}, payload: 1700},
    {type: 'SMALL STRAIGHT', dimensions: {length: 500, width: 250, height: 170}, payload: 2500},
    {type: 'LARGE STRAIGHT', dimensions: {length: 700, width: 350, height: 200}, payload: 4000}
];

const checkTruckCompatibility = (payload, length, width, height) => {
    return truckDimensions.filter(truck => truck.dimensions.length > length && truck.dimensions.width > width && truck.dimensions.height > height && truck.payload > payload).map(item => item.type);
}

const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  const handleServerError = (res, error) => {
    console.log(error);
    res.status(500).send({message: 'Server error'});
  };

  const addLoad = async (req, res) => {
    try {
        const {error} = loadValidation(req.body);
        const {name, payload, pickup_address, delivery_address, dimensions} = req.body;
        if(error) {
          return res.status(400).send({message: 'Invalid input data'});
        } else {
            const load = new Load({
                created_by: req.user.id,
                name: name, 
                payload: payload, 
                pickup_address: pickup_address, 
                delivery_address: delivery_address, 
                dimensions: dimensions
            });
            await load
                .save()
                .then(() => res.status(200).send({message: 'Load created successfully'}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        }
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const getLoad = async (req, res) => {
    try {
        const load = await Load.findById(req.params.id);
        if(!load) {
            return res.status(400).send({message: 'No load found'});
        }
        if(req.user.role === 'DRIVER') {
            if(load.assigned_to === req.user.id) {
                return res.status(200).send({load: load});
            } else {
                return res.status(400).send({message: 'This is not your load'}); 
            }
        }
        await Load.findById(req.params.id)
            .then((load) => res.status(200).send({load: load}))
            .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const updateLoad = async (req, res) => {
    try {
        const load = await Load.findOne({_id: req.params.id});
        if(!load) {
            return res.status(400).send({message: 'No load found'});
        }
        if(load.status !== 'NEW') {
            return res.status(400).send({message: 'You cannot change load data when it is posted, assigned or shipped'});
        }
        const {error} = loadValidation(req.body);
        if(error) {
          return res.status(400).send({message: 'Invalid input data'})
        } else {
            const {name, payload, pickup_address, delivery_address, dimensions} = req.body;
            await Load.findByIdAndUpdate(req.params.id, {
                name: name,
                payload: payload,
                pickup_address: pickup_address,
                delivery_address: delivery_address,
                dimensions: dimensions
            })
            .then(() => res.status(200).send({message: 'Load details changed successfully'}))
            .catch(() => res.status(400).send({message: 'Client error'}));
        }
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const postLoad = async (req, res) => {
    try {
        const load = await Load.findOne({_id: req.params.id});
        if(!load) {
            return res.status(400).send({message: 'No load found'});
        }
        const {payload, dimensions} = load;
        const compatibleTrucks = checkTruckCompatibility(payload, dimensions.length, dimensions.width, dimensions.height);
        if(load.status !== 'NEW') {
            return res.status(400).send({message: 'You can post only a new load'});
        }
        await Load.findByIdAndUpdate(req.params.id, {status: 'POSTED'});
        const suitableTrucks = await Truck.find({status: 'IS'});
        if(!suitableTrucks) {
            return res.status(400).send({message: 'Unfortunately there are no available trucks'});
        }
        const readyToDeliverTrucks = suitableTrucks.filter(item => item.assigned_to !== '' && compatibleTrucks.includes(item.type));
        if(readyToDeliverTrucks.length === 0) {
            await Load.findByIdAndUpdate(req.params.id, {status: 'NEW', logs: {message: 'Load could not be assigned as there was no available truck', time: new Date().toISOString()}})
                .then(() => res.status(400).send({message: 'Load cannot be assigned as there is no available driver at the moment'}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        } else if(readyToDeliverTrucks.length === 1) {
            const [truck] = readyToDeliverTrucks;
            await Truck.findByIdAndUpdate(truck._id, {status: 'OL'});
            await Load.findByIdAndUpdate(req.params.id, {assigned_to: truck.assigned_to, status: 'ASSIGNED', state: 'En route to Pick Up', logs: {message: `Load assigned to driver with id ${truck.assigned_to}`, time: new Date().toISOString()}})
                .then(() => res.status(200).send({message: 'Load posted successfully', driver_found: true}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        } else {
            const randomNumber = getRandomIntInclusive(0, readyToDeliverTrucks.length - 1);
            const truck = readyToDeliverTrucks[randomNumber];
            await Truck.findByIdAndUpdate(truck._id, {status: 'OL'});
            await Load.findByIdAndUpdate(req.params.id, {assigned_to: truck.assigned_to, status: 'ASSIGNED', state: 'En route to Pick Up', logs: {message: `Load assigned to driver with id ${truck.assigned_to}`, time: new Date().toISOString()}})
                .then(() => res.status(200).send({message: 'Load posted successfully', driver_found: true}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        }
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const getLoads = async (req, res) => {
    try {
        const {offset, limit, status} = req.query;
        const perPage = Math.max(0, +limit);
        const user = await User.findOne({email: req.user.email});
        if(user.role === 'DRIVER') {
            if(status === 'NEW' || status === 'POSTED') {
                return res.status(400).send({message: 'You can view only assigned or shipped loads'}); 
            }
            await Load.find({status: status, assigned_to: user._id})
                .skip(+offset || 0)
                .limit(+limit || 0)
                .then((loads) => res.status(200).send({loads: loads}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        } else if (user.role === 'SHIPPER') {
            await Load.find({status: status, created_by: user._id})
                .skip(+offset || 0)
                .limit(+limit || 0)
                .then((loads) => res.status(200).send({loads: loads}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        } else {
            return res.status(400).send({message: 'Your role can be either DRIVER or SHIPPER'}); 
        }
    } catch (error) {
      handleServerError(res, error);
    }
  }

  const deleteLoad = async (req, res) => {
    try {
        const load = await Load.findOne({_id: req.params.id});
        if(!load) {
            return res.status(400).send({message: 'No load found'});
        }
        if(load.status !== 'NEW') {
            return res.status(400).send({message: 'You can delete only newly created loads'});
        }
        await Load.findByIdAndDelete(load._id)
            .then(() => res.status(200).send({message: 'Load deleted successfully'}))
            .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const getLoadShippingInfo = async (req, res) => {
    try {
        const load = await Load.findOne({_id: req.params.id});
        if(!load) {
            return res.status(400).send({message: 'No load found'});
        }
        if(load.status !== 'ASSIGNED' && load.status !== 'POSTED') {
            return res.status(400).send({message: 'You can view shipping info only of the assigned or posted loads'});
        }
        const truck = await Truck.findOne({assigned_to: load.assigned_to});
        await Load.findById(load._id)
            .then((load) => res.status(200).send({load: load, truck: truck}))
            .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      handleServerError(res, error);
    }
  };

  module.exports = {
    addLoad,
    getLoad,
    updateLoad,
    postLoad,
    getLoads,
    deleteLoad,
    getLoadShippingInfo
  };