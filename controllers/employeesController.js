const getAllEmployees = (req, res) => {
  res.json({ message: 'Getting all the employees' });
};

const createNewEmployee = (req, res) => {
  res.json({ message: 'Creating all the employees' });
};

const updateEmployee = (req, res) => {
  res.json({ message: 'Updating all the employees' });
};

const deleteEmployee = (req, res) => {
  res.json({ message: 'Deleting all the employees' });
};

const getEmployee = (req, res) => {
  res.json({ message: 'Getting an employee with ID ' + req.params.id });
};

module.exports = {
  getAllEmployees,
  createNewEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployee,
};
