import components from 'core/js/components';
import SchemaTableqView from './schematableqView';
import SchemaTableqModel from './schematableqModel';

export default components.register('schemaTableQ', {
  model: SchemaTableqModel,
  view: SchemaTableqView
});
