import ItemsQuestionModel from 'core/js/models/itemsQuestionModel';
import Ajv from 'libraries/ajv.min';

export default class SchemaTableqModel extends ItemsQuestionModel {

	initialize(...args) {
	  this.loadSchema();
	  super.initialize(...args);
	}

	canSubmit() {
		return true;
	}

	isCorrect() {
		this.disableButtons();
		this.readUserAnswer();
		var isCorrect = this.validateUserAnswer();
		this.set('_isCorrect',isCorrect);
		
		// HACK TO SUPPORT SCORM!
		try {
			if (API.data["cmi.core.lesson_status"]) {
				this.set('_userAnswer',isCorrect);
			}
		} catch(error) {}

		this.set('_canShowFeedback',true);
		return isCorrect;
	}

	setupIncorrectFeedback() {
		var feedback = this.get('_feedback')._incorrect;
		feedback.final += "\n" + this.formatValidationErrors(this.get('validationErrors'));
		this.setAttemptSpecificFeedback(feedback);
	}

	disableButtons() {
		var table = this.get('table');	
		var parent = table.parentNode;
		var buttons = parent.querySelectorAll('button');
		for (var i = 0; i < buttons.length; i++) {
       		buttons[i].classList.add('is-disabled');
      	}
	}
	
	readUserAnswer() {
	  var table = this.get('table');
	  var placeholderText = "click to edit";
	  var data = [];
	  var rows = table.rows;

	  // Iterate over rows (skipping the header row)
	  for (var i = 1; i < rows.length; i++) {
	    var rowData = {};
	    var cells = rows[i].cells;
	    var hasValues = false; // Flag to track if the row has any non-empty cells

	    // Iterate over cells
	    for (var j = 0; j < cells.length; j++) {
	      var cell = cells[j];
	      var value = cell.innerHTML.trim();

	      // Skip cells with placeholder text
	      if (value !== placeholderText) {
	        var columnName = table.rows[0].cells[j].innerHTML.trim();

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
	  this.set("userAnswer", JSON.stringify(data));
	  try {
		if (API.data["cmi.core.lesson_status"]) {
		}
	  } catch(error) {
		this.set("_userAnswer", JSON.stringify(data));
	  }		
	  
	}

	restoreUserAnswers() {
	    if (!this.get('_isSubmitted')) return;

	    const userAnswer = JSON.parse(this.get('_userAnswer'));
	    if (typeof userAnswer === "boolean") {
	    	console.log("CANNOT restore user answer from SCORM data yet");
	    	return;
	    } 

	    this.set('tableData',userAnswer);
  	}

	loadSchema() {
	  const schemaURL = this.get('schema');
	  fetch(schemaURL)
	    .then(response => response.json())
	    .then(schema => {
	      schema["$schema"] = "http://json-schema.org/schema#";
	      this.set('schemaCache',schema); // Store the schema in the cache variable
	    })
	    .catch(error => {
	      console.error('Error loading schema:', error);
	    });
	}

	validateUserAnswer() {
	  const ajv = new Ajv(); // Create a new instance of Ajv
	  const validate = ajv.compile(this.get("schemaCache")); // Compile the cached schema

	  const isValid = validate(JSON.parse(this.get("userAnswer"))); // Validate the data against the schema

	  if (isValid) {
	    return true;
	  } else {
	  	this.set('validationErrors',validate.errors);
	    //console.log(validate.errors); // Output the validation errors
	    return false;
	  }
	}

	formatValidationErrors(errors) {
	  const errorMessages = errors.map(error => {
	    const { instancePath, schemaPath, keyword, params, message } = error;
	    let errorMessage = `${instancePath} ${message}`;

	    if (keyword === 'enum') {
	      const { allowedValues } = params;
	      errorMessage += `: "${allowedValues.join('", "')}"`;
	    } else if (keyword === 'type') {
	      const { type } = params;
	      errorMessage += `: ${type}`;
	    }

	    //errorMessage += ` (${schemaPath}, ${keyword})`;

	    return errorMessage;
	  });

	  return errorMessages.join('\n');
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
