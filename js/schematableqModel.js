import QuestionModel from 'core/js/models/questionModel';
import Ajv from 'libraries/ajv.min';
import Adapt from 'core/js/adapt';

export default class SchemaTableqModel extends QuestionModel {

  initialize(...args) {
    this.loadSchema();
    this.set('_canSubmit', false);
    super.initialize(...args);
  }

  canSubmit() {
    return true;
  }

  isCorrect() {
    return this.get('_isCorrect');
  }

  restoreUserAnswers() {
    if (!this.get('_isSubmitted')) return;
    this.set('_shouldShowMarking', true);
    this.set('_canShowMarking', true);
    try {
      if (Adapt.spoor) {
        if (Adapt.spoor.config._isEnabled) {
          const data = JSON.parse(this.getCookie('schemaTableQ-' + this.get('_id')));
          if (data._userAnswer) {
            this.set('userAnswer', data._userAnswer);
          }
        }
      }
    } catch (err) {
      this.set('userAnswer', this.get('_userAnswer'));
    }
    this.set('tableData', JSON.parse(this.get('userAnswer')));
    this.markQuestion();
  }

  markQuestion() {
    this.set('_canShowFeedback', true);
    if (!this.get('userAnswer')) {
      this.readUserAnswer();
      this.disableButtons();
    }
    const isCorrect = this.validateUserAnswer();
    if (!isCorrect) {
      this.setupIncorrectFeedback();
    }
    // HACK TO SUPPORT SCORM!
    try {
      if (Adapt.spoor) {
        if (Adapt.spoor.config._isEnabled) {
          this.set('_userAnswer', isCorrect);
          this.setCookie('_userAnswer', this.get('userAnswer'));
        }
      }
    } catch (error) {}
    this.set('_isCorrect', isCorrect);
  }

  setCookie(key, value) {
    const id = this.get('_id');
    let object = JSON.parse(this.getCookie('schemaTableQ-' + id)) || {};
    object[key] = value;
    object = JSON.stringify(object);
    document.cookie = 'schemaTableQ-' + id + '=' + encodeURIComponent(object) + '; expires=Fri, 31 Dec 2032 23:59:59 GMT; path=/';
  }

  getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split('=');
      if (cookie[0] === name) {
        return decodeURIComponent(cookie[1]);
      }
    }
    return null;
  }

  setupIncorrectFeedback() {
    const feedback = this.get('_feedback')._incorrect;
    feedback.final += '\n' + this.formatValidationErrors(this.get('validationErrors'));
    this.set('_feedback'._incorrect, feedback);
  }

  disableButtons() {
    const table = this.get('table');
    const parent = table.parentNode;
    const buttons = parent.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.add('is-disabled');
    }
  }

  readUserAnswer() {
    const table = this.get('table');
    const placeholderText = this.get('placeholderText');
    const data = [];
    const rows = table.rows;

    // Iterate over rows (skipping the header row)
    for (let i = 1; i < rows.length; i++) {
      const rowData = {};
      const cells = rows[i].cells;
      let hasValues = false; // Flag to track if the row has any non-empty cells

      // Iterate over cells
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const value = cell.innerHTML.trim();

        // Skip cells with placeholder text
        if (value !== placeholderText) {
          const columnName = table.rows[0].cells[j].innerHTML.trim();

          // Check for different data types
          if (value === 'true' || value === 'false') {
            rowData[columnName] = value === 'true';
          } else if (/^-?\d+(\.\d+)?$/.test(value)) {
            rowData[columnName] = parseFloat(value);
          } else {
            rowData[columnName] = value;
          }

          hasValues = true; // Set flag to true if a non-empty cell is found
        }
      }

      // Add row data to the array if it has at least one non-empty cell
      if (hasValues) {
        data.push(rowData);
      }
    }
    this.set('userAnswer', JSON.stringify(data));
    if (!Adapt.spoor) {
      this.set('_userAnswer', JSON.stringify(data));
    }
  }

  loadSchema() {
    const schemaURL = this.get('schema');
    fetch(schemaURL)
      .then(response => response.json())
      .then(schema => {
        schema.$schema = 'http://json-schema.org/schema#';
        this.set('schemaCache', schema); // Store the schema in the cache variable
      })
      .catch(error => {
        console.error('Error loading schema:', error);
      });
  }

  validateUserAnswer() {
    const ajv = new Ajv({ allErrors: true }); // Create a new instance of Ajv

    const validate = ajv.compile(this.get('schemaCache')); // Compile the cached schema

    const isValid = validate(JSON.parse(this.get('userAnswer'))); // Validate the data against the schema

    if (isValid) {
      return true;
    } else {
      this.set('validationErrors', validate.errors);
      return false;
    }
  }

  formatValidationErrors(errors) {
    const errorMessages = errors.map(error => {
      const { instancePath, keyword, params, message } = error;
      let errorMessage = `${instancePath} ${message}`;

      if (keyword === 'enum') {
        const { allowedValues } = params;
        errorMessage += `: "${allowedValues.join('", "')}"`;
      } else if (keyword === 'type') {
        const { type } = params;
        errorMessage += `: ${type}`;
      }
      return errorMessage.replace('/0/', '');
    });

    return errorMessages.join('<br/>');
  }

  /**
* used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
* returns the user's answers as a string in the format 'answer1[,]answer2[,]answer3'
* the use of [,] as an answer delimiter is from the SCORM 2004 specification for the fill-in interaction type
*/
  getResponse() {
    return this.get('userAnswer');
  }

  /**
    * used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
    */
  getResponseType() {
    return 'fill-in';
  }

}
