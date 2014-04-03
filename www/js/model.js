/* global define */
/**
 * 
 * Model controller to build, load, and retrieve Dragoon problems
 * @author: Brandon Strong
 * 
 **/

/**
 * 
 * NOTE: this.beginX, this.beginY, this.nodeWidth, and this.nodeHeight should 
 *      be set to match the requirements of the viewer part of the MVC. These 
 *      variables control where the nodes will begin being placed, and tell the
 *      model the size of the nodes to avoid collisions.
 * 
 */

define([
    "dojo/_base/array", "dojo/_base/lang"
], function(array, lang) {


    return function() {

        var obj = {
            constructor: function(/*string*/ mode, /*string*/ name) {
                // Summary: Initializes the object (the Dragoon problem)
                // Note: beginX and beginY specify coordinates where nodes can begin appearing
                //      when the student adds them; nodeWidth and nodeHeighth can be manually
                //      adjusted to allow enough room in between the nodes; _updateNextXYPosition()
                //      uses nodeWidth and nodeHeighth to know where to place new student nodes

                this.x = this.beginX;
                this.y = this.beginY;
                this.checkedNodes = new Array();
                this.model = {task: {
                        taskName: name,
                        time: {start: 0, end: 10, step: .5},
                        properties: {},
                        image: {},
                        taskDescription: "",
                        givenModelNodes: [],
                        studentModelNodes: []
                    }};

                /*
                 Define the "active model" (see doucumentation/javascript.md).
                 */
                obj.active = (mode == "AUTHOR") ? obj.given : obj.student;

            },
            // Private variables
            _ID: 1,
            // Public variables
            beginX: 400,
            beginY: 100,
            nodeWidth: 200,
            nodeHeight: 200,
            lastNodeVisible: null,
            /**
             * 
             * Private methods; these methods should not be accessed outside of this class
             *  
             */
            _updateNextXYPosition: function() {
                // Summary: keeps track of where to place the next node; function detects collisions
                //      with other nodes; is called in addStudentNode() before creating the node
                // Tags: private
                for (var i = 0; i < this.model.task.studentModelNodes.length; i++) {
                    var x = this.model.task.studentModelNodes[i].position.x;
                    var y = this.model.task.studentModelNodes[i].position.y;
                    while (this.x > x - this.nodeWidth && this.x < x + this.nodeWidth &&
                            this.y > y - this.nodeHeight && this.y < y + this.nodeHeight) {
                        if (this.x + this.nodeWidth < document.documentElement.clientWidth + 100)
                            this.x += this.nodeWidth;
                        else {
                            this.x = this.beginX;
                            this.y += this.nodeHeight;
                        }
                    }
                }
            },
            _checkChildren: function(/*string*/ currentNodeID, /*string array*/ checkedNodes) {
                // Summary: searches the depth of a tree below the given node and returns an
                //      optimal child node; if no optimal child node exists it returns null
                // Note: checkedNodes is an array that stores the nodes that have been checked 
                //      to avoid an infinite loop; it is set to empty before _checkChildren() 
                //      is called by getNextOptimalNode()
                // Tags: private
                checkedNodes.push(currentNodeID);
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++)
                    if (currentNodeID === this.model.task.givenModelNodes[i].ID) {
                        for (var ii = 0; ii < this.model.task.givenModelNodes[i].inputs.length; ii++)
                            if (checkedNodes.indexOf(this.model.task.givenModelNodes[i].inputs[ii].ID) === -1)
                                if (!this.isNodeVisible(this.model.task.givenModelNodes[i].inputs[ii].ID)) {
                                    return this.model.task.givenModelNodes[i].inputs[ii].ID;
                                } else {
                                    var temp = this._checkChildren(this.model.task.givenModelNodes[i].inputs[ii].ID, checkedNodes);
                                    if (temp !== null)
                                        return temp;
                                }
                        return null;
                    }
                return null;
            },
            /**
             * 
             * Public methods
             *  
             */

            /**
             * Functions to load or retrieve a model in string format
             */
            loadModel: function(/*object*/ model) {
                // Summary: loads a model object;
                //      allows Dragoon to load a pre-defined program or to load a users saved work
                //      Sets id for next node.
                this.model = model;

                /*
                 We use ids of the form "id"+integer.  This loops through
                 all the nodes in the model and finds the lowest integer such
                 that there is no name conflict.  We simply ignore any ids that
                 are not of the form "id"+integer.
                 */
                var largest = 0;
                var intID = function(/*object*/ node) {
                    if (node.ID.length >= 2 && node.ID.slice(0, 2) == "id") {
                        var n = parseInt(node.ID.slice(2));
                        if (n && n > largest)
                            largest = n;
                    }
                };
                array.forEach(this.given.getNodes(), intID);
                array.forEach(this.student.getNodes(), intID);
                this._ID = largest + 1;
            },
            getModelAsString: function() {
                // Summary: Returns a JSON object in string format
                //          Should only be used for debugging.
                return JSON.stringify(this.model, null, 4);
            },
            /**
             * GETTERS; retrieves specific attributes from a model; node attributes are usually
             * by accessed by the node's ID--if the ID is not known use getNodeIDByName("name");
             */
            getBeginX: function() {
                return this.beginX;
            },
            getBeginY: function() {
                return this.beginY;
            },
            getPhase: function() {
                return this.model.task.properties.phase;
            },
            getType: function() {
                return this.model.task.properties.type;
            },
            getTaskName: function() {
                return this.model.task.taskName;
            },
            getURL: function() {
                console.error("The function getURL() is deprecated. Use getImageURL().");
            },
            getImage: function() {
                return this.model.task.image;
            },
            getImageURL: function() {
                return this.model.task.image.URL;
            },
            getImageDimensons: function() {
                return {width: this.model.task.image.width, height: this.model.task.image.height};
            },
            getTime: function() {
                return this.model.task.time;
            },
            getUnits: function() {
                return this.model.task.time.units;
            },
            getAllUnits: function() {
                // Summary:  returns a list of all distinct units 
                // (string format) defined in a problem.
                // Need to order list alphabetically.
                var unitList = new Array(this.getUnits());
                array.forEach(this.given.getNodes(), function(node) {
                    if (array.indexOf(unitList, node.units) == -1) {
                        unitList.push(node.units);
                    }
                }, this);
                return unitList;
            },
            getTaskDescription: function() {
                return this.model.task.taskDescription;
            },
            isParentNode: function(/*string*/ id) {
                // Summary: returns true if a node is the parent node in a tree structure; parent 
                //      nodes will be displayed first when the student demos a node name/description
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++) {
                    if (id === this.model.task.givenModelNodes[i].ID)
                        return this.model.task.givenModelNodes[i].parentNode;
                }
                return null;
            },
            isExtraNode: function(/*string*/ id) {
                // Summary: returns true if the node is not required in the final model
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++) {
                    if (id === this.model.task.givenModelNodes[i].ID)
                        return this.model.task.givenModelNodes[i].extra;
                }
                return null;
            },
            isNodeVisible: function(/*string*/ studentID, /*string*/ givenID) {
                // Summary: returns true if the node is in the student model,
                //          excluding the current student node.
                return array.some(this.student.getNodes(), function(node) {
                    return node.ID !== studentID && node.descriptionID === givenID;
                });
            },
            //var temp = this.model.task.givenModelNodes[i].ID;myid6, myid3
            isNodesParentVisible: function(/*string*/ studentID, /*string*/ givenID) {
                // Summary: returns true if the given node's parent is visible (if the 
                //      node is an input into another node that is in the student model)
                var nodes = this.given.getNodes();

                return array.some(nodes, function(node) {
                    return array.some(node.inputs, function(input) {
                        return givenID === input.ID && this.isNodeVisible(studentID, node.ID); // node.ID is the parent of input.ID;
                    }, this);
                }, this);
            },
            //
            areNodeInputsVisible: function(/*string*/ id) {
                //Summary: returns true if all of the inputs in a given node are visible
                for (var i = 0; i < this.given.getInputs(id).length; i++)
                    if (!this.isNodeVisible(this.given.getInputs(id)[i]))
                        return false;
                return true;
            },
            areAllNodesVisible: function() {
                //Summary: returns true if all of the nodes in the model are visible
                var givenNodes = this.given.getNodes();
                for (var i = 0; i < givenNodes.length; i++) {
                    if (!array.some(this.student.getNodes(), function(studentNode) {
                        return this.isNodeVisible(studentNode.ID, givenNodes[i].ID);
                    }, this))
                        return false;
                }
                return true;
            },
            /*isInputVisible: function(givenNodeID) {
             return array.some(this.student.getNodes(), function(node) {
             return node.descriptionID === givenNodeID;
             });
             },
             
             array.forEach(this.given.getNodes(), function(node) {
             if (node.ID == id) {
             ret = node.name;
             }
             }, this);
             */

            /**
             * Next 2 nodes are to return the next optimal node; needs testing; in process;
             *      getOptimalNode() can be called to search through the model and return 
             *      an optimal node as long as the model is in a tree structure
             */
            _getNextOptimalNode: function(/*string*/ givenNodeID) {
                // Summary: Accepts the id of a parent node and returns the next optimal
                //      child node that is not visible, or null if all descendants are visible
                var optimalNode = null;
                var isInputVisible = function(givenNodeID) {
                    return array.some(obj.student.getNodes(), function(node) {
                        return node.descriptionID === givenNodeID;
                    }, this);
                };
                array.forEach(this.given.getNode(givenNodeID).inputs, function(node) {
                    if (!isInputVisible(node.ID) && givenNodeID !== node.ID) {
                        optimalNode = node.ID;
                    } else if (node.inputs) {
                        optimalNode = this._getNextOptimalNode(node.ID);
                    }
                }, obj);
                return optimalNode;
            },
            getOptimalNode: function(/*string*/ studentID) {
                // Summary: Returns the next optimal node, first checking for children
                //      of visible parent nodes, and then checking for parent nodes that
                //      aren't visible; 
                //      
                // Note: the student node studentID is assumed incorrect so it is ignored

                var solutionNodes = this.solution.getNodes();
                var nextNode = "model complete";

                for (var i = 0; i < solutionNodes.length; i++) {
                    if (solutionNodes[i].parentNode) {
                        if (!this.isNodeVisible(studentID, solutionNodes[i].ID))
                            nextNode = solutionNodes[i].ID;
                        else if (solutionNodes[i].inputs)
                            return this._getNextOptimalNode(solutionNodes[i].ID);
                        console.log("*^*^*Parent:\n", solutionNodes[i].ID);
                    }
                }
                return nextNode;
            },
            getCorrectAnswer: function(/*string*/ studentID, /*string*/ nodePart) {
                // Summary: returns the correct answer for a given part of a node;
                //      used by the pedagogical model
                if (nodePart === "description")
                    return this.getOptimalNode(studentID);
                else {
                    var id = this.student.getDescriptionID(studentID);
                    var node = this.given.getNode(id);
                    return node[nodePart];
                }
            },
            getNodeAttemptCount: function(/*string*/ id, /*string*/ nodePart) {
                // Summary: returns the number of attempts a student has made on the 
                //      given part of the problem
                return this.given.getNode(id).attemptCount[nodePart] || null;
            },
            incrementDescriptionAttemptCount: function(/*string*/ id) {
                // Summary: returns the number of attempts a student has made on the 
                //      given part of the problem
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++)
                    if (id === this.model.task.givenModelNodes[i].ID)
                        this.model.task.givenModelNodes[i].attemptCount.description++;
            },
            /**
             * SETTERS
             */
            setBeginX: function(/*int*/ x) {
                this.beginX = x;
            },
            setBeginY: function(/*int*/ y) {
                this.beginY = y;
            },
            setTaskName: function(/*string*/ name) {
                this.model.task.taskName = name;
            },
            setImage: function(/*object*/ options) {
                lang.mixin(this.model.task.image, options);
            },
            setTime: function(/*object*/ options) {
                lang.mixin(this.model.task.time, options);
            },
            setPhase: function(/*string*/ phase) {
                // Summary: set the model's phase
                this.model.task.properties.phase = phase;
            },
            setType: function(/*string*/ type) {
                // Summary: set the model's type
                this.model.task.properties.type = type;
            },
            setTaskDescription: function(/*string*/ description) {
                // Summary: set the task description
                this.model.task.taskDescription = description;
            },
            /**
             * Functions to add and delete nodes in the given model and the student model
             */
            deleteNode: function(/*string*/ id) {
                // Summary: deletes a node with a given id; re-orders the remaining nodes; removes the
                //      given node from other nodes' inputs and erases equations containing the deleted node
                var deleted = false;
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++) {
                    this.deleteNodeInput(this.model.task.givenModelNodes[i].ID, id);
                    if (this.model.task.givenModelNodes[i].equation.indexOf(id) > -1)
                        this.model.task.givenModelNodes[i].equation = "";
                    if (id === this.model.task.givenModelNodes[i].ID) {
                        this.model.task.givenModelNodes.splice(this.model.task.givenModelNodes.indexOf(this.model.task.givenModelNodes[i]), 1);
                        deleted = true;
                        if (this.model.task.givenModelNodes.length > i)
                            this.model.task.givenModelNodes[i].order = this.model.task.givenModelNodes[i].order - 1;
                    }
                    else if (deleted)//maintains order of nodes during deletion                    
                        this.model.task.givenModelNodes[i].order = this.model.task.givenModelNodes[i].order - 1;
                }
                this.deleteStudentNode(id);
                return deleted;
            },
            deleteNodeInput: function(/*string*/ id, /*string*/ inputIDToRemove) {
                // Summary: remove an input from a node in the given model
                for (var i = 0; i < this.model.task.givenModelNodes.length; i++) {
                    if (id === this.model.task.givenModelNodes[i].ID)
                        for (var ii = 0; ii < this.model.task.givenModelNodes[i].inputs.length; ii++) {
                            if (inputIDToRemove === this.model.task.givenModelNodes[i].inputs[ii].ID) {
                                this.model.task.givenModelNodes[i].inputs.splice(this.model.task.givenModelNodes[i].inputs.indexOf(this.model.task.givenModelNodes[i].inputs[ii]), 1);
                            }
                        }
                }
            },
            deleteStudentNode: function(/*string*/ id) {
                // Summary: deletes a node with a given id from the student model; removes
                //      the given node from other nodes inputs within the student model and
                //      erases equations containing the deleted node; resets matching given
                //      model nodes to no longer be marked correct
                var deleted = false;
                for (var i = 0; i < this.model.task.studentModelNodes.length; i++) {
                    this.deleteStudentNodeInput(this.model.task.studentModelNodes[i].ID, id);
                    if (this.model.task.studentModelNodes[i].equation.indexOf(id) > -1)
                        this.model.task.studentModelNodes[i].equation = "";
                    if (id === this.model.task.studentModelNodes[i].ID) {
                        if (this.model.task.studentModelNodes[i].descriptionID) // checks if node was in given model
                            for (var ii = 0; ii < this.model.task.givenModelNodes.length; ii++)
                                if (this.model.task.givenModelNodes[ii].ID === id)
                                    this.model.task.givenModelNodes[ii].resetStatus();
                        this.model.task.studentModelNodes.splice(this.model.task.studentModelNodes.indexOf(this.model.task.studentModelNodes[i]), 1);
                        deleted = true;
                        break;
                    }
                }
                return deleted;
            },
            addStudentNodeInput: function(/*string*/ input, /*string*/ inputInto) {
                // Summary: adds a node (input) as an input into the given node in 
                //      the StudentModel (inputInto) both parameters are node ID's
                var inputID = "";
                if (inputInto === input)//node can't be input into itself
                    return false;
                for (var i = 0; i < this.model.task.studentModelNodes.length; i++)
                    if (input === this.model.task.studentModelNodes[i].ID) {
                        inputID = this.model.task.studentModelNodes[i].ID;
                        i = this.model.task.studentModelNodes.length;
                    } else {
                        if (i === this.model.task.studentModelNodes.length - 1)
                            return false;
                    }
                for (i = 0; i < this.model.task.studentModelNodes.length; i++) {
                    if (inputInto === this.model.task.studentModelNodes[i].ID) {

                        for (var ii = 0; ii < this.model.task.studentModelNodes[i].inputs.length; ii++) {
                            if (input === this.model.task.studentModelNodes[i].inputs[ii].ID)
                                return false;
                        }
                        this.model.task.studentModelNodes[i].addInput(inputID);
                        return true;
                    }
                }
                return false;
            },
            deleteStudentNodeInput: function(/*string*/ id, /*string*/ inputIDToRemove) {
                // Summary: remove an input from a node in the student model
                for (var i = 0; i < this.model.task.studentModelNodes.length; i++) {
                    if (id === this.model.task.studentModelNodes[i].ID)
                        for (var ii = 0; ii < this.model.task.studentModelNodes[i].inputs.length; ii++) {
                            if (inputIDToRemove === this.model.task.studentModelNodes[i].inputs[ii].ID) {
                                this.model.task.studentModelNodes[i].inputs.splice(this.model.task.studentModelNodes[i].inputs.indexOf(this.model.task.studentModelNodes[i].inputs[ii]), 1);
                            }
                        }
                }
            },
            setStudentNodeXY: function(/*string*/ id, /*int*/ xPos, /*int*/ yPos) {
                // Summary: sets the "X" and "Y" values of a node's position
                for (var i = 0; i < this.model.task.studentModelNodes.length; i++)
                    if (id === this.model.task.studentModelNodes[i].ID) {
                        this.model.task.studentModelNodes[i].position.x = xPos;
                        this.model.task.studentModelNodes[i].position.y = yPos;
                    }
            },
            setToDemo: function(/*string*/ id, /*string*/ part) {
                // Summary: sets the given part of the problem to "demo" in the given node
                //      and puts the correct answer into the studentModelNode; intended to 
                //      be used when the student asks for the answer or attempts the question 
                //      incorrectly too many times
                var node = obj.student.getNode(id);
                if (node) {
                    var descriptionID = node.descriptionID;
                    switch (part) {
                        case "description":
                            obj.student.setDescriptionID(id, obj.getOptimalNode());
                            break;
                        case "type":
                            obj.student.setType(id, obj.given.getType(descriptionID));
                            break;
                        case "initial":
                            obj.student.setInitial(id, obj.given.getInitial(descriptionID));
                            break;
                        case "units":
                            obj.student.setUnits(id, obj.given.getUnits(descriptionID));
                            break;
                        case "equation":
                            obj.student.setEquation(id, obj.given.getEquation(descriptionID));
                            break;
                        default:
                            console.error("Invalid part ", part);
                    }
                    this.given.setStatus(id, part, "demo");
                }
            }
        };

        /* 
         add subclasses with model accessors 
         
         TODO:  Move associated functions themselves to this 
         section.
         */

        // Methods common to both student and given.
        // These will be mixed into both obj.given and obj.student
        var both = {
            isNode: function(/*string*/ id) {
                return array.some(this.getNodes(), function(node) {
                    return node.ID === id;
                });
            },
            isInput: function(/*string*/ mainNodeID, /*string*/ inputID) {
                // Summary: returns true if the node identified by inputID is an 
                //      input into the mainNodeID 
                var main = this.getNode(mainNodeID);
                return main && array.some(main.inputs, function(input) {
                    return array.some(input, function(link) {
                        return link.ID == inputID;
                    });
                });
            },
            getNode: function(/*string*/ id) {
                // This is not very efficient:  should probably have separate
                // method for each sub-class and construct a hash table.
                var nodes = this.getNodes();
                var l = nodes.length;
                for (var i = 0; i < l; i++) {
                    if (nodes[i].ID == id)
                        return nodes[i];
                }
                console.warn("No matching node for '" + id + "'");
                return null;
            },
            getType: function(/*string*/ id) {
                var node = this.getNode(id);
                return node && node.type;
            },
            getInitial: function(/*string*/ id) {
                var node = this.getNode(id);
                return node && node.initial;
            },
            getUnits: function(/*string*/ id) {
                return this.getNode(id).units;
            },
            getEachNodeUnitbyID: function() {
                //summary: returns key/value pair of node-id/unit
                var unitList = {};
                array.forEach(this.getNodes(), function(node) {
                    unitList[node.ID] = node.units;
                });
                return unitList;
            },
            getEquation: function(/*string*/ id) {
                var node = this.getNode(id);
                return node && node.equation;
            },
            getInputs: function(/*string*/ id) {
                // Summary: return an array containing the input ids for a node.
                var ret = this.getNode(id);
                return ret && array.map(ret.inputs, function(input) {
                    return input.ID;
                });
            },
            getOutputs: function(/*string*/ id) {
                // Summary: return an array containing the output ids for a node.
                var outputs = [];
                array.forEach(this.getNodes(), function(node) {
                    if (array.some(node.inputs, function(input) {
                        return input.ID == id;
                    })) {
                        outputs.push(node.ID);
                    }
                });
                return outputs;
            },
            setInputs: function(/*array*/ inputs, /*string*/ inputInto) {
                // Silently filter out any inputs that are not defined.
                var node = this.getNode(inputInto);
                if (node) {
                    node.inputs = array.map(
                            array.filter(inputs, this.isNode, this),
                            function(id) {
                                return {ID: id};
                            },
                            this
                            );
                }
            },
            setType: function(/*string*/ id, /*string*/ type) {
                var ret = this.getNode(id);
                if (ret)
                    ret.type = type;
            },
            addInput: function(/*string*/ input, /*string*/ inputInto) {
                console.error("Deprecated.  Use setInputs() instead.");
            }
        };

        obj.given = lang.mixin({
            addNode: function(options) {
                // Summary: builds a new node and returns the node's unique id
                //          Can optionally add initial values to node.
                obj._updateNextXYPosition();
                var newNode = lang.mixin({
                    ID: "id" + obj._ID++,
                    inputs: [],
                    position: {x: obj.x, y: obj.y},
                    attemptCount: {
                        description: 0,
                        type: 0,
                        initial: 0,
                        units: 0,
                        equation: 0
                    },
                    status: {}
                }, options || {});
                obj.model.task.givenModelNodes.push(newNode);
                return newNode.ID;
            },
            isExtra: function(/*string*/ id) {
                return this.getNode(id).genus;
            },
            getNodes: function() {
                return obj.model.task.givenModelNodes;
            },
            getName: function(/*string*/ id) {
                // Summary: returns the name of a node matching the student model.
                //      If no match is found, then return null.
                var node = this.getNode(id);
                return node && node.name;
            },
            getNodeIDByName: function(/*string*/ name) {
                // Summary: returns the id of a node matching the given name from the 
                //          given or extra nodes.  If none is found, return null.
                var id;
                var gotIt = array.some(this.getNodes(), function(node) {
                    id = node.ID;
                    return node.name === name;
                });
                return gotIt ? id : null;
            },
            getDescriptions: function() {
                // Summary: returns an array of all descriptions with
                // name (label) and any associated node id (value).
                // TO DO:  The list should be sorted.
                return array.map(this.getNodes(), function(node) {
                    return {label: node.description, value: node.ID};
                });
            },
            getDescription: function(/*string*/ id) {
                return this.getNode(id).description;
            },
            getStatus: function(/*string*/ id, /*string*/ nodePart) {
                return this.getNode(id).status[nodePart];
            },
            setName: function(/*string*/ id, /*string*/ name) {
                this.getNode(id).name = name.trim();
            },
            setDescription: function(/*string*/ id, /*string*/ description) {
                this.getNode(id).description = description.trim();
            },
            setParent: function(/*string*/ id, /*bool*/ parent) {
                this.getNode(id).parentNode = parent;
            },
            setExtra: function(/*string*/ id, /*bool*/ extra) {
                this.getNode(id).extra = extra;
            },
            setUnits: function(/*string*/ id, /*string*/ units) {
                this.getNode(id).units = units;
            },
            setInitial: function(/*string*/ id, /*float*/ initial) {
                this.getNode(id).initial = initial;
            },
            setEquation: function(/*string*/ id, /*string | object*/ equation) {
                this.getNode(id).equation = equation;
            },
            setAttemptCount: function(/*string*/ id, /*string*/ part, /*string*/ count) {
                this.getNode(id).attemptCount[part] = count;
            },
            setStatus: function(/*string*/ id, /*string*/ part, /*string*/ status) {
                // Summary: tracks student progress (correct, incorrect) on a given node;
                this.getNode(id).status[part] = status;
            }
        }, both);

        obj.solution = lang.mixin({
            getNodes: function() {
                return array.filter(obj.model.task.givenModelNodes, function(node) {
                    return !node.genus;
                });
            },
            // This method is common with given but not student.
            getName: function(/*string*/ id) {
                // Summary: returns the name of a node matching the student model.
                //      If no match is found, then return null.
                var node = this.getNode(id);
                return node && node.name;
            }
        }, both);

        obj.student = lang.mixin({
            addNode: function(options) {
                // Summary: builds a new node in the student model and 
                //          returns the node's ID.  Can optionally set 
                //          properties.
                obj._updateNextXYPosition();
                var newNode = lang.mixin({
                    ID: "id" + obj._ID++,
                    inputs: [],
                    position: {x: obj.x, y: obj.y},
                    status: {}
                }, options || {});
                obj.model.task.studentModelNodes.push(newNode);
                return newNode.ID;
            },
            getDescriptionID: function(id) {
                // Summary: Return any matched given model id for student node.
                var node = this.getNode(id);
                return node && node.descriptionID;
            },
            getNodeIDFor: function(givenID) {
                // Summary: returns the id of a student node having a matching descriptionID;
                //          return null if no match is found.
                var id;
                var gotIt = array.some(this.getNodes(), function(node) {
                    id = node.ID;
                    return node.descriptionID == givenID;
                });
                return gotIt ? id : null;
            },
            getName: function(/*string*/ id) {
                // Summary: returns the name of a node matching the student model.
                //      If no match is found, then return null.
                /*
                 Determine what student has selected for this node 
                 and then look for matching node in given model
                 and extraDescriptions
                 */
                var node = this.getNode(id);
                return node && node.descriptionID
                        && obj.given.getName(node.descriptionID);
            },
            getNodes: function() {
                return obj.model.task.studentModelNodes;
            },
            getStatusDirectives: function(/*string*/ id) {
                //Summary:  Return a list of directives (like PM does).
                //          to set up node editor.
                var status = this.getNode(id).status;
                var directives = [];
                for (var control in status) {
                    for (var attribute in status[control]) {
                        directives.push({
                            id: control,
                            attribute: attribute,
                            value: status[control][attribute]
                        });
                    }
                }
                return directives;
            },
            setDescriptionID: function(/*string*/ id, /*string*/ descriptionID) {
                this.getNode(id).descriptionID = descriptionID;
            },
            setInitial: function(/*string*/ id, /*float*/ initial) {
                this.getNode(id).initial = initial;
            },
            setUnits: function(/*string*/ id, /*string*/ units) {
                console.log("******** Setting student units to ", units);
                this.getNode(id).units = units;
            },
            setEquation: function(/*string*/ id, /*string | object*/ equation) {
                this.getNode(id).equation = equation;
            },
            setStatus: function(/*string*/ id, /*string*/ control, /*object*/ options) {
                //Summary: Update status for a particular control.
                //         options may have attributes "status" and "disabled".
                var attributes = this.getNode(id).status[control];
                // When undefined, status[control] needs to be set explicitly.
                this.getNode(id).status[control] = lang.mixin(attributes, options);
                return attributes;
            }
        }, both);

        // Execute the constructor
        obj.constructor.apply(obj, arguments);

        return obj;

    };

});
