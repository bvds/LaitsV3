/* global define */
/*
 *                          AUTHOR mode-specific handlers
 */
define([
    "dojo/_base/array", 'dojo/_base/declare', "dojo/_base/lang",
    'dojo/dom-style', "dojo/ready",
    'dijit/registry',
    './controller', "./pedagogical_module", "./equation"
], function(array, declare, lang, style, ready, registry, controller, PM, expression) {

    /*
     Methods in controller specific to the student modes
     */

    return declare(controller, {
        _PM: null,
        constructor: function(mode, subMode, model) {
            console.log("++++++++ In student constructor");
            this._PM = new PM(mode, subMode, model);
            ready(this, "initStudentHandles");

        },
        initStudentHandles: function() {

            var desc = registry.byId(this.controlMap.description);
            desc.on('Change', lang.hitch(this, this.handleSelectDescription));

            var unitsWidget = registry.byId(this.controlMap.units);
            unitsWidget.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleUnits.apply(this, arguments);
            }));

            var inputsWidget = registry.byId(this.controlMap.inputs);
            inputsWidget.on('Change',  lang.hitch(this, function(){
                return this.disableHandlers || this.handleInputs.apply(this, arguments);
            }));

        },
        handleSelectDescription: function(selectDescription) {
            console.log("****** in handleChooseDescription ", this.currentID, selectDescription);
            if (selectDescription == 'defaultSelect')
                return; // don't do anything if they choose default

            this._model.active.setDescriptionID(this.currentID, selectDescription);
            this.updateNodes();

            var directives = this._PM.processAnswer(this.currentID, 'description', selectDescription);
            array.forEach(directives, function(directive) {
                this.updateModelStatus(directive);
                if (this.widgetMap[directive.id]) {
                    var w = registry.byId(this.widgetMap[directive.id]);
                    // console.log("*********  setting widget ", w, " using ", directive);
                    if (directive.attribute == 'value') {
                        w.set(directive.attribute, directive.value, false);
                        // Update the model.
                        this._model.student.setDescriptionID(this.currentID, directive.value);
                    }
                    else
                        w.set(directive.attribute, directive.value);
                } else {
                    console.warn("Directive with unknown id: " + directive.id);
                }
            }, this);
        },
        handleType: function(type) {
            console.log("****** Student has chosen type ", type, this);
            if (type == 'defaultSelect')
                return; // don't do anything if they choose default
            this.updateType(type);
            var directives = this._PM.processAnswer(this.currentID, 'type', type);
            array.forEach(directives, function(directive) {
                console.log("*********** update node editor ", directive);
                this.updateModelStatus(directive);
                if (this.widgetMap[directive.id]) {
                    var w = registry.byId(this.widgetMap[directive.id]);

                    if (directive.attribute == 'value') {  //if correct value suggested by PM
                        w.set(directive.attribute, directive.value, false);
                        this.updateType(directive.value);
                    } else
                        w.set(directive.attribute, directive.value);
                } else {
                    console.warn("Directive with unknown id: " + directive.id);
                }
            }, this);
            this.updateEquationLabels(type);
        },
        updateEquationLabels:function(type){
            var name = this._model.student.getName(this.currentID);
            var nodeName = '';
            if(type=='accumulator'){
                var nodeName = 'new '+name+' = '+ 'old '+name+' +';
                document.getElementById("timeStepLabel").style.visibility="visible";
            }else if(type=='function'){
                var nodeName = name+' = ';
                document.getElementById("timeStepLabel").style.visibility="hidden";
            }else{
                document.getElementById("timeStepLabel").style.visibility="hidden";
            }
            document.getElementById('equationLabel').innerHTML = nodeName;
        }  ,
        handleInitial: function(initial) {

            if (this.disableInitialTextEvent) {
                this.disableInitialTextEvent = false;
                return;
            }

            console.log("****** Student has chosen initial value", initial, this);

            // updating node editor and the model.
            this._model.active.setInitial(this.currentID, initial);
            var directives = this._PM.processAnswer(this.currentID, 'initial', initial);
            array.forEach(directives, function(directive) {
                // console.log("*********** update node editor ", directive);
                this.updateModelStatus(directive);
                if (this.widgetMap[directive.id]) {
                    var w = registry.byId(this.widgetMap[directive.id]);
                    w.set(directive.attribute, directive.value);
                    if (directive.attribute == 'value') { //if correct value suggested by PM update model
                        this._model.active.setInitial(this.currentID, directive.value);
                        this.disableInitialTextEvent = true;
                    }
                    w.set(directive.attribute, directive.value); //third parameter doesn't work for false attribute
                } else {
                    console.warn("Directive with unknown id: " + directive.id);
                }
            }, this);
        },

        /*
        *    handle event on inputs box
        * */
        handleInputs: function(id){
            /*if(id.MOUSEDOWN){
             if(this.lastHandleInputId){
             console.log('onclick event found onSelect, use old id '+this.lastHandleInputId);
             id=this.lastHandleInputId; //restore
             }else
             return;  //if last id is not defined return
             }else
             this.lastHandleInputId=id; //copy it for next onClick event*/

            //check if id is  not select else return

            console.log("*******Student has chosen input", id, this);
            // Should add name associated with id to equation
            // at position of cursor or at the end.
            var expr = this._model.given.getName(id);
            this.equationInsert(expr);
            //restore to default  - creating select input as stateless
            registry.byId(this.controlMap.inputs).set('value', 'defaultSelect',false);
        },
        handleUnits: function(unit) {
            console.log("*******Student has chosen unit", unit, this);

            // updating node editor and the model.
            this._model.student.setUnits(this.currentID, unit);
            var directives = this._PM.processAnswer(this.currentID, 'units', unit);
            array.forEach(directives, function(directive) {
                this.updateModelStatus(directive);
                if (this.widgetMap[directive.id]) {
                    var w = registry.byId(this.widgetMap[directive.id]);
                    if (directive.attribute == 'value') {
                        w.set(directive.attribute, directive.value, false);
                        // Update the model.
                        this._model.student.setUnits(this.currentID, directive.value);
                    } else
                        w.set(directive.attribute, directive.value);
                } else {
                    console.warn("Directive with unknown id: " + directive.id);
                }
            }, this);
        },
        equationDoneHandler: function() {
            var directives = [];
            var parse = this.equationAnalysis(directives);
            if (parse) {
                var dd = this._PM.processAnswer(this.currentID, 'equation', parse);
                directives = directives.concat(dd);
            }
            // Now apply directives, either from PM or special messages above.
            array.forEach(directives, function(directive) {
                this.updateModelStatus(directive);
                if (this.widgetMap[directive.id]) {
                    var w = registry.byId(this.widgetMap[directive.id]);
                    // console.log(">>>>>>>>> setting directive ", directive);
                    if (directive.attribute == 'value') {

                        var equation = directive.value;
                        console.log("equation before conversion ", equation);
                        var mEquation = equation ? expression.convert(this._model.given, equation) : '';  //since student node doesn't have same ids as equation
                        console.log("equation after conversion ", mEquation);
                        w.set(directive.attribute, mEquation, false);

                        console.log('before replacing by descriptionIDs ' + equation);
                        equation = expression.convertUsingDescriptionIDs(this._model.student, equation);
                        console.log('after replacing by descriptionIDs ' + equation);

                        // Update the model.
                        console.warn("Updating equation in model to ", equation, " based on PM.");
                        //update the equation to student ids, use descriptionID from nodes of givenModel which will match with student node id

                        this._model.student.setEquation(this.currentID, equation);
                    } else
                        w.set(directive.attribute, directive.value);
                } else {
                    console.warn("Directive with unknown id: " + directive.id);
                }

            }, this);
        },
        /* 
         Settings for a new node, as supplied by the PM.
         These don't need to be recorded in the model, since they
         are applied each time the node editor is opened.
         */

        initialControlSettings: function(nodeid) {
            array.forEach(this._PM.newAction(), function(directive) {
                var w = registry.byId(this.controlMap[directive.id]);
                if (directive.attribute == 'value')
                    w.set(directive.attribute, directive.value, false);
                else
                    w.set(directive.attribute, directive.value);
            }, this);
            // This sets the selected value in the description.
            var desc = this._model.student.getDescriptionID(nodeid);
            console.log('description is', desc || "not set");
            registry.byId(this.controlMap.description).set('value', desc || 'defaultSelect', false);

            /*
             Set color and enable/disable
             */
            array.forEach(this._model.student.getStatusDirectives(nodeid), function(directive) {
                var w = registry.byId(this.controlMap[directive.id]);
                w.set(directive.attribute, directive.value);
                if(directive.id=='type'){
                    this.updateEquationLabels(directive.value);
                }
            }, this);
        }


    });
});
