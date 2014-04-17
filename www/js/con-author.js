/* global define */
/*
 *                          AUTHOR mode-specific handlers
 */
define([
    "dojo/_base/array", 'dojo/_base/declare', "dojo/_base/lang",
    'dojo/dom-style', 'dojo/ready',
    'dijit/registry',
    './controller',
    "./equation",
    "dojo/domReady!"

], function(array, declare, lang, style, ready, registry, controller,equation) {

    return declare(controller, {
        constructor: function() {
            console.log("++++++++ In author constructor");
            this.authorControls();
            ready(this, "initAuthorHandles");
        },
        authorControls: function() {
            console.log("++++++++ Setting AUTHOR format in Node Editor.");
            style.set('nameControl', 'display', 'block');
            style.set('descriptionControlStudent', 'display', 'none');
            style.set('descriptionControlAuthor', 'display', 'block');
            style.set('selectUnits', 'display', 'none');
            style.set('setUnitsControl', 'display', 'inline');
            style.set('inputControlAuthor', 'display', 'block');
            style.set('inputControlStudent', 'display', 'none');
        },
        initAuthorHandles: function() {
            var name = registry.byId("setName");
            name.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleName.apply(this, arguments);
            }));
            var kind = registry.byId("selectKind");
            kind.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleKind.apply(this, arguments);
            }));
            var description = registry.byId("setDescription");
            description.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleSetDescription.apply(this, arguments);
            }));
            var units = registry.byId("setUnits");
            units.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleSetUnits.apply(this, arguments);
            }));

            var inputsWidget = registry.byId("setInput");
            inputsWidget.on('Change', lang.hitch(this, function() {
                return this.disableHandlers || this.handleInputs.apply(this, arguments);
            }));

        },
        /*
         Added handler for type field in AUTHOR mode
         */
        handleType: function(type) {
            // Summary: Sets the type of the current node.
            this._model.active.setType(this.currentID, type);
            console.log("In AUTHOR mode. Type selected is:" + type);
        },
        /*
         Added handler for type field in AUTHOR mode
         */
        handleInitial: function(initial) {
            // Summary: Sets the initial value of the current node.
            this._model.active.setInitial(this.currentID, initial);
            console.log("In AUTHOR mode. Initial value is: " + initial);
        },
        handleInputs: function(text) {
            console.log("In AUTHOR mode. Input selected is: " + text);
        },
        handleName: function(name) {
            console.log("**************** in handleName ", name);

            /* check if node with name already exists and
               if name is parsed as valid variable
            */
            if(!this._model.given.getNodeIDByName(this.currentID) && equation.isVariable(name)){
                // check all nodes in the model for equations containing name of this node
                // replace name of this node in equation with its ID
                this.findAndReplace(name);
                // save the model
                this._model.active.setName(this.currentID, name);
                //set title of node editor with name of the node
                this._nodeEditor.set('title', this._model.active.getName(this.currentID));

            }
            else{
                console.error("Node name already exists");
            }
        },
        handleKind: function(kind) {
            console.log("**************** in handleKind ", kind);
        },
        handleDescription: function(description) {
            // Summary: Checks to see if the given description exists; if the 
            //      description doesn't exist, it sets the description of the current node.
            if (!this._model.active.getNodeIDByDescription(description)) {
                this._model.active.setDescription(this.currentID, description);
                console.log("In AUTHOR mode. Description value is: " + description);
            } else {
                console.warn("In AUTHOR mode. Attempted to use description that already exists: " + description);
            }
        },
        handleSetDescription: function(setDescription) {
            console.log("**************** in handleSetDescription ", setDescription);
            this.handleDescription(setDescription);
        },
        handleSetUnits: function(units) {
            // Summary: Sets the units of the current node.
            this._model.active.setUnits(this.currentID, units);
            console.log("**************** in handleSetUnits ", units);
        },
        equationDoneHandler: function() {
            var directives = [];
            var parse = this.equationAnalysis(directives);
            // Now apply directives
            array.forEach(directives, function(directive) {
                this.updateModelStatus(directive);
                var w = registry.byId(this.widgetMap[directive.id]);
                w.set(directive.attribute, directive.value);
            }, this);            
            console.log("*****\n*****Model:");
            console.log(this._model.getModelAsString());
            return directives;
        },
        initialControlSettings: function(nodeid) {
            var desc = this._model.given.getDescription(nodeid);
            console.log('description is', desc || "not set");
            registry.byId("setDescription").set('value', desc || 'defaultSelect', false);
        },

        /*
        *  this function searches for name of the node equations of given model
        *  and replaces node name with its ID
        * */
        findAndReplace: function(string){
            //iterte over all nodes in given model
            array.forEach(this._model.given.getNodes(),lang.hitch(this,function(nodeId){
                //get equation of the node
                var expression = this._model.given.getEquation(nodeId.ID);

                if(expression){
                    var parse = equation.parse(expression);
                    if(parse){
                        // for every variable in the equation, check if variable matches with
                        // node name. If yes, replace node name with its ID
                        array.forEach(parse.variables(),lang.hitch(this,function(variable){

                            if(variable == string){
                                parse.substitute(variable,this.currentID);
                                this._model.given.setEquation(nodeId.ID,parse.toString());
                            }
                        }))
                    }
                }
            }))
        }
    });
});
