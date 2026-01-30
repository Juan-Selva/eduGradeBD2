const validate = require('./validate');
const estudianteValidator = require('./estudiante.validator');
const calificacionValidator = require('./calificacion.validator');
const institucionValidator = require('./institucion.validator');
const materiaValidator = require('./materia.validator');

module.exports = {
  validate,
  estudiante: estudianteValidator,
  calificacion: calificacionValidator,
  institucion: institucionValidator,
  materia: materiaValidator
};
