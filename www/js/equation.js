/* global define */
/*
 *  Routines associated with the Parser:
 *  * Equation checking to compare an equation given by the student with a given equation
 *  * Convert equation between format stored in model and format shown on node editor.
 */

define([
    "dojo/_base/array", "dojo/_base/lang", "parser/parser"
], function(array, lang, Parser){

    return {
        parse: function(equation){
            return Parser.parse(equation);
        },
        isVariable: Parser.isVariable,
        logging : null,

        /**
         * Evaluates two expressions for equivalence by comparing the given variables, and then
         *      testing the expressions with values assigned to the variables
         **/

        areEquivalent: function(/*string*/ id, /*object*/ model, /*string*/ studentEquation){
            //Summary: For a given model node id, checks the correctness of the student equation.
            //
            if(typeof studentEquation == 'string')
                var student = Parser.parse(studentEquation);
            else
                student = studentEquation;

            // Choose values so that the given model node can be evaluated.
            var givenEqn = model.given.getEquation(id);
            console.assert(givenEqn, "Given node '" + id + "' does not have an equation.");
            if(!givenEqn){
                this.logging.log('client-message', {file:'equation.js', functionName:'areEquivalent', message:'Given node id does not have an equation', value:id});
            }
            var givenParse = Parser.parse(model.given.getEquation(id));
            var givenVals = {};
	    array.forEach(model.given.getNodes(), function(node){
                /* Parameter and accumulator nodes are treated as independent. */
		if(!node.genus && (node.type == 'parameter' || node.type == 'accumulator')){
                    givenVals[node.ID] = Math.random();
		}
	    });
            array.forEach(givenParse.variables(), function(variable){
                // console.log("    ==== evaluating given variable ", variable);
                // given model variables should all be given node IDs
                this.evalVar(variable, model.given, givenVals);
            }, this);
            var givenResult = givenParse.evaluate(givenVals);

            /*
             Go through student variables.  Each variable can be either
             a given/extra model node name or a student modelnode id.
             A variable may, or may not, have a value assigned when 
             the given model was evaluated above.
             */
            var studentVals = {};
            array.forEach(student.variables(), function(variable){
                console.log("    ==== evaluating student variable ", variable);
                var givenID;
                if(model.student.isNode(variable)){
                    givenID = model.student.getDescriptionID(variable);
                }else {
                    givenID = model.given.getNodeIDByName(variable);
                }
                /* This should never happen:  there is a check for unknown variables
                 at a higher level. */
                console.assert(givenID, "Student variable '" + variable + "' has no match.");
                if(!givenID){
                    this.logging.log('client-message', {file:'equation.js', functionName:'areEquivalent', message:'Student variable has no match', value:variable});
                }
                // At this point, givenID can also be from the extra nodes.
                this.evalVar(givenID, model.given, givenVals);
                studentVals[variable] = givenVals[givenID];
            }, this);
            var studentResult = student.evaluate(studentVals);
            return Math.abs(studentResult - givenResult) <= 10e-10 * Math.abs(studentResult + givenResult);
        },
        /*
         Recursively evaluate functions in the model.
         If the function nodes have circular dependencies, then an error will be produced.
	 This is the same algorithm used in the function topologicalSort.
         */
        evalVar: function(id, subModel, vals, parents){
	    parents = parents || {};
            console.assert(subModel.isNode(id), "evalVar: unknown variable '" + id + "'.");
            if(!subModel.isNode(id)){
                this.logging.log('client-message', {file:'equation.js', functionName:'evalVar', message:'unknown variable for evaluation', value:id});
            }
            var node = subModel.getNode(id);
            if(!(id in vals)){
                if(parents[id]){
                    // Should send a message to the user.
                    throw new Error("Function node '" + node.id + "' has circular dependency.");
                }
                parents[id] = true;
                // Evaluate function node
		console.log("=========== about to parse ", node.equation);
		console.warn("========    It is important to log failures of this parse");
                var parse = Parser.parse(node.equation);
                array.forEach(parse.variables(), function(x){
                    this.evalVar(x, subModel, vals, parents);
                }, this);
                vals[id] = parse.evaluate(vals);
                parents[id] = false;
            }
        },

        convert: function(subModel, equation){
            try {
                var expr = Parser.parse(equation);
            }catch(e){
                console.warn("Should log this as a JavaScript error.");
                this.logging.log('client-message', {file:'equation.js', functionName:'convert', message:'error in parser', value:e});
                return equation;
            }
            this.mapVariableNodeNames = {};
            // console.log("            parse: ", expr);
            array.forEach(expr.variables(), function(variable){
                /* A student equation variable can be a student node id
                 or given (or extra) model node name (if the node has not been
                 defined by the student). */
                if(subModel.isNode(variable)){
                    var nodeName = subModel.getName(variable);
                    // console.log("=========== substituting ", variable, " -> ", nodeName);
                    expr.substitute(variable, nodeName);
                    // console.log("            result: ", expr);
                }
            }, this);
            return expr.toString();
        },
        /*
         Adding quantity to student model:  Update 
         equations and inputs of existing nodes.
         */
        addQuantity: function(id, subModel){

            var name = subModel.getName(id);
            array.forEach(subModel.getNodes(), function(node){
                if(node.equation){
                    try {
                        var expr = Parser.parse(node.equation);
                    }catch(e){
                        /* If an equation fails to parse, then the input
                         string is stored as the equation for that node.
                         Thus, if the parse fails, just move on to the 
                         next node. */
                        return;
                    }
                    var changed = false;
                    array.forEach(expr.variables(), function(variable){
                        if(name == variable){
                            changed = true;
                            expr.substitute(name, id);
                        }
                    });
                    if(changed){
                        node.equation = expr.toString(true);
                        node.inputs = [];
                        array.forEach(expr.variables(), function(id){
                            if(subModel.isNode(id))
                                node.inputs.push({ID: id});
                        });
                    }
                }
            });
        },
        isSum: function(parse){
            // Return true if expression is a sum of variables, allowing for minus signs.
            // Note that a bare variable will also return true.
            var ops = parse.operators();
            var allowed = {"+": true, "-": true, "variable": true};
            for(var op in ops){
                if(ops[op] > 0 && !allowed[op])
                    return false;
            }
            return true;
        },
        isProduct: function(parse){
            // Return true if the expression is a product of variables, allowing for division
            // Note that explicit powers (a^2) are not allowed, which is mathematically incorrect
            // but we have no mechanism for adding powers on our user interface.  For problems
            // that are that complicated, the student should be using the full text entry anyway.
            // Note that a bare variable will also return true.
            var ops = parse.operators();
            var allowed = {"*": true, "/": true, "variable": true};
            for(var op in ops){
                if(ops[op] > 0 && !allowed[op])
                    return false;
            }
            return true;
        },
	gradient: function(parse, /*boolean*/ monomial, point){
	    // Find the numerical partial derivatives of the expression at
	    // the given point or at a random point, if the point is not supplied.
	    // Both the given point and the return vector are expressed as objects.
	    // If monomial is true, take the gradient of the logarithm and multiply by the variable.
	    // That is, find     x d/dx log(f)
	    // For a monomial, this will give the degree of each factor 
	    /*
	     In principle, one could calculate the gradient algebraically and 
	     use that to determine coefficients.  However, the current parser library
	     is not really set up to do algebraic manipulations.
	     */
	    if(!point){
		point = {};
		array.forEach(parse.variables(), function(x){
		    // For products, we want to stay away from zero.
		    point[x]= Math.random()+0.5;
		});
	    }
	    var partial = {};
	    var y = parse.evaluate(point);
	    array.forEach(parse.variables(), function(x){
		var z = lang.clone(point);
		var dx = 1.0e-6*Math.abs(point[x]==0?1:point[x]);
		z[x] -= 0.5*dx;
		var y1 = parse.evaluate(z);
		z[x] += dx;
		var y2 = parse.evaluate(z);
		partial[x] = (y2-y1)/dx;
		if(monomial){
		    partial[x] *= point[x]/y;
		}
	    });
	    return partial;
	},

	// Test if this is a pure sum or product
	// If so, determine connection labels
	createInputs: function(parse){
	    var grad;
	    var chooseSign = function(x, a, b, c){
		return x>0.5?a:(x<-0.5?b:c);
	    };
	    if(this.isSum(parse)){
		grad = this.gradient(parse, false);
		return array.map(parse.variables(), function(x){
		    return {ID: x, label: chooseSign(grad[x],"","-","0")};
		});
	    }else if(this.isProduct(parse)){
		grad = this.gradient(parse, true);
		return array.map(parse.variables(), function(x){
		    return {ID: x, label: chooseSign(grad[x],"","/","none")};
		});
	    }else{
		// General expression
		return array.map(parse.variables(), function(x){
		    return {ID: x};
		});
	    }
	},

        convertUsingDescriptionIDs:function(subModel, equation){
            try {
                var expr = Parser.parse(equation);
            }catch(e){
                console.warn("Should log this as a JavaScript error.");
                this.logging.log('client-message', {file:'equation.js', functionName:'convertUsingDescriptionIDs', message:'error in parser', value:e});
                return equation;
            }
            array.forEach(expr.variables(), function(variable){

                var givenNodeId = subModel.getNodeIDFor(variable);
                expr.substitute(variable, givenNodeId);
            }, this);
            return expr.toString();
        },

	initializeTimeStep: function(model){
	    // Summarize:  set up env for the function evaluateTimeStep
	    var env = {parse: {}, xvars: [], parameters: {}};
	    var fv = {};
	    array.forEach(model.getNodes(), function(node){
		// Include all nodes that belong in the solution.
		if(!node.genus){
		    switch(node.type){
		    case "parameter":
			// No equation to parse
			env.parameters[node.ID] = node.initial;
			break;
		    case "function":
			var fparse = Parser.parse(node.equation);
			env.parse[node.ID] = fparse;
			// We can only calculate the order for functions
			// after all the variables are given.
			fv[node.ID] = fparse.variables();
			break;
		    case "accumulator":
			env.parse[node.ID] = Parser.parse(node.equation);
			// This sets the order of the xvars.
			env.xvars.push(node.ID);
			break;
		    default:
			new Error("Invalid type ", node.type);
		    }
		}
	    });
	    // Find correct evaluation order for function nodes.
	    // This is a partially ordered set, so we need 
	    // a topological sort.
	    env.functions = this.topologicalSort(fv);
	    return env;
	},

	// This is the same algorithm that is used in the function evalVar()
	topologicalSort: function(directedGraph){
	    // Summary: returns the topological sort of a directed acyclic graph.
	    //          If a cycle is detected, then an error condition is given.
	    //          Children that are not themselves a vertex are ignored.
	    // directedGraph:  An object of the form {vertex: [array of children], ...}
	    //
	    var sorted = [], evaluated = {};
	    // list of parents is used to detect any cycles in the graph.
	    var parents = {};
	    var followEdge = function(vertex){
		if(!(vertex in evaluated)){
		    parents[vertex] = true;
		    array.forEach(directedGraph[vertex], function(child){
			if(parents[child]){
			    new Error("Found cycle in graph", directedGraph);
			}
			if(child in directedGraph){
			    followEdge(child);
			}
		    });
		    parents[vertex] = false;
		    sorted.push(vertex);
		    evaluated[vertex] = true;
		}
	    };
            for(var v in directedGraph){
		followEdge(v);
	    }
	    return sorted;
	},

	evaluateTimeStep:  function(x){
	    // Summary:  evaluate model at some time step.
	    // Description:  The rationale behind this notation is that the 
	    //    numerical integration routine should know nothing about 
	    //    variable names or the model.
	    // x: array containing current value for dynamic variables (accumulators)
	    // The scope should contain the following objects: 
 	    //     parse: Object containing parses labled by node ID
	    //     xvars:  Array giving the node ID for each x
	    //     parameters:  Object containing values for parameter nodes, labeled by nodeID
	    //     functions:  Array containing node ID for each function.  The order is such
	    //                 that the later functions in the array depend on earlier functions
	    // Returns:  array containing the gradient of the dynamic variables, in the order
	    //     specified by xvars.
	    var variables = {};
	    for(var i=0; i<x.length; i++){
		variables[this.xvars[i]] = x[i];
	    }
	    lang.mixin(variables, this.parameters);
	    array.forEach(this.functions, function(id){
		variables[id] = this.parse[id].evaluate(variables);
	    }, this);
	    return array.map(this.xvars, function(id){
		return this.parse[id].evaluate(variables);
	    }, this);	    
	},

        setLogging: function(/*string*/ logging){
            this.logging = logging;
        },

    };
});

