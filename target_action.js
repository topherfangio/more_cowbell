// ==========================================================================
// Project:   More Cowbell -- Shit you really want if you develop with SproutCore.
// Copyright: ©2011 Erich Atlas Ocean.
// License:   Licensed under an MIT license (see license.js).
// ==========================================================================
/*global EO */

/** @static
  
  This mixin implements the basic target-action handling for a custom view.
  
  @author Erich Ocean
*/
EO.TargetAction = {
  
  /**
    The name of the action you want triggered when performAction() is called.  
    
    This property is used in conjunction with the target property to execute
    a method when performAction() is called.
    
    If you do not set a target, then calling performAction() will cause the
    responder chain to search for a view that implements the action you name
    here.  If you set a target, then performAction() will try to call the 
    method on the target itself.
    
    @type String
  */
  action: null,
  
  /**
    The target object to invoke the action on when performAction() is called.
    
    If you set this target, the action will be called on the target object
    directly when performAction() is called.  If you leave this property set to
    null, then the responder chain will be searched for a view that implements 
    the action.
    
    @type Object
  */
  target: null,
  
  /**
    Triggers the action to be performed. Calls will/didTriggerAction() before
    and after the action is performed. Use this method when invoking the action
    with the keyboard, or programmatically (i.e. when not via mouse or touch
    events).
    
    @returns {bool} success/failure of the request
  */  
  triggerAction: function(evt, target, action) {
    var ret = false ;
    if (this.willTriggerAction) this.willTriggerAction() ;
    ret = this.performAction(evt, target, action) ;
    if (this.didTriggerAction) this.didTriggerAction() ;
    return ret ;
  },
  
  /**
    Perform the action. Does not call will/didTiggerAction(). Use this method 
    in you custom views when the action is triggered by mouse or touch action.
     
    @returns {bool} success/failure of the request
 */
  performAction: function(evt, target, action) {
    var realTarget = target || this.get('target') || null,
        realAction = action || this.get('action'),
        rootResponder = this.getPath('pane.rootResponder') ;
    
    if (action && rootResponder) {
      return rootResponder.sendAction(realAction, realTarget, this, this.get('pane')) ;
    } else return false ;
  }
  
  /**
    [Optional] This method is called before a view's action is triggered (manually). 
    You can implement this method in your own subclass to perform any thing needed 
    before an action is performed, such as highlighting a button.
  */
  // willTriggerAction: function() {}
  
  /**
    [Optional] This method is called after a view's action is triggered (manually).
    You can implement this method in your own subclass to perform any cleanup needed 
    after an action is performed, such as removing a highlight on a button.
  */
  // didTriggerAction: function() {}
  
};
