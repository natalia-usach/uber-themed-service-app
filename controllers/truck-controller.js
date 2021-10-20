const Truck = require('../models/Truck');
const Load = require('../models/Load');
const {truckValidation} = require('../validations/truck');

const firstState = 'En route to Pick Up';
const secondState = 'Arrived to Pick Up';
const thirdState = 'En route to delivery';
const fourthState = 'Arrived to delivery';
  
  const handleServerError = (res, error) => {
    console.log(error);
    res.status(500).send({message: 'Server error'});
  };

  const addTruck = async (req, res) => {
    try {
        const {error} = truckValidation(req.body);
        if(error) {
          return res.status(400).send({message: 'Invalid input data'});
        } else {
            const truck = new Truck({created_by: req.user.id, assigned_to: '', type: req.body.type});
            await truck
                .save()
                .then(() => res.status(200).send({message: 'Truck created successfully'}))
                .catch(() => res.status(400).send({message: 'Client error'}));
        }
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };

  const assignTruck = async (req, res) => {
    try {
        const truckId = req.params.id;
        const truck = await Truck.findOne({_id: truckId});
        let assignedTrucks = [];
        await Truck.find({assigned_to: req.user.id})
            .then((trucks) => {
                assignedTrucks = trucks;
            })
            .catch(() => res.status(400).send({message: 'Client error'}));
        if(truck.created_by !== req.user.id) {
            return res.status(400).send({message: 'This is not your truck'});
        }
        if(assignedTrucks.length !== 0) {
            return res.status(400).send({message: 'You already have a truck assigned to you'});
        }
        await Truck.findByIdAndUpdate(truckId, {assigned_to: req.user.id})
                .then(() => {
                    res.status(200).send({message: 'Truck assigned successfully'});
                })
                .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };

  const deleteTruck = async (req, res) => {
    try {
        const truckId = req.params.id;
        const truck = await Truck.findOne({_id: truckId});
        if(truck.created_by !== req.user.id) {
            return res.status(400).send({message: 'This is not your truck'});
        }
        if(truck.assigned_to !== '') {
            return res.status(400).send({message: 'You cannot delete a truck that you have already assigned yourself to'});
        }
        await Truck.findByIdAndDelete(truckId)
                .then(() => {
                    res.status(200).send({message: 'Truck deleted successfully'});
                })
                .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };

  const getTrucks = async (req, res) => {
    try {
        await Truck.find({created_by: req.user.id})
                .then((trucks) => {
                    res.status(200).send({trucks: trucks});
                })
                .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };
  

  const getTruck = async (req, res) => {
    try {
        const truckId = req.params.id;
        const truck = await Truck.findOne({_id: truckId});
        if(!truck) {
            return res.status(400).send({message: 'No truck found'});
        }
        return res.status(200).send({truck: truck});
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };

  const updateTruck = async (req, res) => {
    try {
        const truckId = req.params.id;
        const truck = await Truck.findOne({_id: truckId});
        if(!truck) {
            return res.status(400).send({message: 'No truck found'});
        }
        if(truck.assigned_to !== '' || truck.status === 'OL') {
            return res.status(400).send({message: 'You cannot change truck info when it is already assigned to a driver'});
        }
        const {error} = truckValidation(req.body);
        if(error) {
          return res.status(400).send({message: 'Invalid input data'})
        } else {
            await Truck.findByIdAndUpdate(truckId, {type: req.body.type})
                        .then(() => res.status(200).send({message: 'Truck details changed successfully'}))
                        .catch(() => res.status(400).send({message: 'Client error'}));
                    }
    } catch (error) {
      console.log(error);
      handleServerError(res, error);
    }
  };

  const getActiveLoad = async (req, res) => {
    try {
        await Load.find({assigned_to: req.user.id})
            .then((load) => res.status(200).send({load: load}))
            .catch(() => res.status(400).send({message: 'Client error'}));
    } catch (error) {
      handleServerError(res, error);
    }
  };

  const goToNextLoadState = async (req, res) => {
    try {
        const load = await Load.findOne({assigned_to: req.user.id});
        if(!load) {
            return res.status(400).send({message: 'No active load found'});
        }
        const loadState = load.state;
        switch(loadState) {
            case firstState:
                await Load.findByIdAndUpdate(load._id, {state: secondState, logs: [...load.logs, {message: 'The truck has arrived to pick up the load', time: new Date().toISOString()}]})
                    .then(() => res.status(200).send({message: `Load state changed to '${secondState}'`}))
                    .catch(() => res.status(400).send({message: 'Client error'}));
                break;
            case secondState:
                await Load.findByIdAndUpdate(load._id, {state: thirdState, logs: [...load.logs, {message: 'The load is on its way to its destination', time: new Date().toISOString()}]})
                    .then(() => res.status(200).send({message: `Load state changed to '${thirdState}'`}))
                    .catch(() => res.status(400).send({message: 'Client error'}));
                break;
            case thirdState:
                const truck = await Truck.findOne({assigned_to: req.user.id});
                if(!truck) {
                    return res.status(400).send({message: 'No active load found'});
                }
                await Truck.findByIdAndUpdate(truck._id, {status: 'IS'});
                await Load.findByIdAndUpdate(load._id, {state: fourthState, status: 'SHIPPED', logs: [...load.logs, {message: 'The truck has arrived to the delivery destination', time: new Date().toISOString()}]})
                    .then(() => res.status(200).send({message: `Load state changed to '${fourthState}'`}))
                    .catch(() => res.status(400).send({message: 'Client error'}));
                    break;
            case fourthState:
                res.status(400).send({message: 'Load is already shipped'});
                break;
        }
    } catch (error) {
      handleServerError(res, error);
    }
  };

  module.exports = {
    addTruck,
    assignTruck,
    deleteTruck,
    getTrucks,
    getTruck,
    updateTruck,
    getActiveLoad,
    goToNextLoadState
  };
  