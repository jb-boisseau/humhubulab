/**
 * Module for creating an manipulating modal dialoges.
 * Normal layout of a dialog:
 * 
 * <div class="modal">
 *     <div class="modal-dialog">
 *         <div class="modal-content">
 *             <div class="modal-header"></div>
 *             <div class="modal-body"></div>
 *             <div class="modal-footer"></div>
 *         </div>
 *     </div>
 * </div>
 *  
 * @param {type} param1
 * @param {type} param2
 */
humhub.initModule('ui.modal', function (module, require, $) {
    var object = require('util').object;
    var additions = require('ui.additions');
    var config = require('config').module(module);
    
    var loader = require('ui.loader');
    
    module.initOnPjaxLoad = false;
    
    //Keeps track of all initialized modals
    var modals = [];


    /**
     * Template for the modal splitted into different parts. Those can be overwritten my changing or overwriting module.template.
     */
    var template = {
        container : '<div class="modal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true" style="display: none; background:rgba(0,0,0,0.1)"><div class="modal-dialog"><div class="modal-content"></div></div></div>',
        header : '<div class="modal-header"><button type="button" class="close" data-modal-close="true" aria-hidden="true">×</button><h4 class="modal-title"></h4></div>',
        body: '<div class="modal-body"></div>',
    }
    
    var ERROR_DEFAULT_TITLE = 'Error';
    var ERROR_DEFAULT_MESSAGE = 'An unknown error occured!';

    /**
     * The Modal class can be used to create new modals or manipulate existing modals.
     * If the constructor finds an element with the given id we use the existing modal,
     * if the id is not already used, we create a new modal dom element.
     * 
     * @param {string} id - id of the modal
     */
    var Modal = function (id) {
        this.$modal = $('#' + id);
        if (!this.$modal.length) {
            this.createModal(id);
        }
        this.initModal();
        modals.push(this);
    };

    /**
     * Creates a new modal dom skeleton.
     * @param {type} id the modal id
     * @returns {undefined}
     */
    Modal.prototype.createModal = function (id) {
        this.$modal = $(module.template.container).attr('id', id);
        $('body').append(this.$modal);
    };

    /**
     * Initializes default modal events and sets initial data.
     * @returns {undefined}
     */
    Modal.prototype.initModal = function () {
        //Set the loader as default content
        this.reset();
        var that = this;

        //Set default modal manipulation event handlers
        this.getDialog().on('click', '[data-modal-close]', function () {
            that.close();
        }).on('click', '[data-modal-clear-error]', function () {
            that.clearErrorMessage();
        }); 
    };

    /**
     * Closes the modal with fade animation and sets the loader content
     * @returns {undefined}
     */
    Modal.prototype.close = function () {
        var that = this;
        this.$modal.fadeOut('fast', function () {
            that.$modal.modal('hide');
            that.reset();
        });
    };

    /**
     * Sets the loader content and shows the modal
     * @returns {undefined}
     */
    Modal.prototype.loader = function () {
        this.reset();
        this.show();
    };

    /**
     * Sets the default content (a loader animation)
     * @returns {undefined}
     */
    Modal.prototype.reset = function () {
        loader.set(this.$body);
        this.isFilled = false;
    };

    /**
     * Sets the given content and applies content additions.
     * @param {string|jQuery} content - content to be set
     * @param {function} callback - callback function is called after html was inserted
     * @returns {undefined}
     */
    Modal.prototype.content = function (content, callback) {
        try {
            var that = this;
            this.clearErrorMessage();
            this.getContent().html(content).promise().always(function () {
                additions.applyTo(that.getContent());
                !callback || callback(this.$modal);
            });
            this.isFilled = true;
        } catch (err) {
            console.error('Error while setting modal content', err);
            this.setErrorMessage(err.message);
            //We try to apply additions anyway
            additions.applyTo(that.$modal);
        }
    };

    /**
     * Sets an errormessage and title. This function either creates an standalone
     * error modal with title and message, or adds/replaces a errorboxmessage to
     * already exising and filled modals.
     * @param {type} title
     * @param {type} message
     * @returns {undefined}
     */
    Modal.prototype.error = function (title, message) {

        if (arguments.length === 1 && title) {
            message = (title.getFirstError) ? title.getFirstError() : title;
            title = (title.getErrorTitle) ? title.getErrorTitle() : ERROR_DEFAULT_TITLE;
        }

        title = title || ERROR_DEFAULT_TITLE;
        message = message || ERROR_DEFAULT_MESSAGE;

        //If there is no content yet we create an error only content
        if (!this.isFilled) {
            this.clear();
            this.setTitle(title);
            this.setBody('');
            this.setErrorMessage(message);
            this.show();
        } else {
            //TODO: allow to set errorMessage and title even for inline messages
            this.setErrorMessage(message);
        }
    };

    /**
     * Removes existing error messages
     * @returns {undefined}
     */
    Modal.prototype.clearErrorMessage = function () {
        var modalError = this.getErrorMessage();
        if (modalError.length) {
            modalError.fadeOut('fast', function () {
                modalError.remove();
            });
        }
    };

    /**
     * Adds or replaces an errormessagebox
     * @param {type} message
     * @returns {undefined}
     */
    Modal.prototype.setErrorMessage = function (message) {
        var $errorMessage = this.getErrorMessage();
        if ($errorMessage.length) {
            $errorMessage.css('opacity', 0);
            $errorMessage.text(message);
            $errorMessage.animate({'opacity': 1}, 'fast');
        } else {
            this.getBody().prepend('<div class="modal-error alert alert-danger">' + message + '</div>');
        }
    };

    /**
     * Returns the current errormessagebox
     * @returns {humhub.ui.modal_L18.Modal.prototype@call;getContent@call;find}
     */
    Modal.prototype.getErrorMessage = function () {
        return this.getContent().find('.modal-error');
    };

    /**
     * Shows the modal
     * @returns {undefined}
     */
    Modal.prototype.show = function () {
        this.$modal.modal('show');
    };

    /**
     * Clears the modal content
     * @returns {undefined}
     */
    Modal.prototype.clear = function () {
        this.getContent().empty();
    };

    /**
     * Retrieves the modal content jQuery representation
     * @returns {humhub.ui.modal_L18.Modal.prototype@pro;$modal@call;find}
     */
    Modal.prototype.getContent = function () {
        //We use the :first selector since jQuery refused to execute javascript if we set content with inline js
        return this.$modal.find('.modal-content:first');
    };

    /**
     * Retrieves the modal dialog jQuery representation
     * @returns {humhub.ui.modal_L18.Modal.prototype@pro;$modal@call;find}
     */
    Modal.prototype.getDialog = function () {
        return this.$modal.find('.modal-dialog');
    };

    /**
     * Searches for forms within the modal
     * @returns {humhub.ui.modal_L18.Modal.prototype@pro;$modal@call;find}
     */
    Modal.prototype.getForm = function () {
        return this.$modal.find('form');
    };

    /**
     * Adds or replaces a modal-title with close button and a title text.
     * @param {type} title
     * @returns {undefined}
     */
    Modal.prototype.setTitle = function (title) {
        var $header = this.getHeader();
        if (!$header.length) {
            this.getContent().prepend($(module.template.header));
            $header = this.getHeader();
        }
        $header.find('.modal-title').html(title);
    };

    /**
     * Adds or replaces the current modal-body
     * @param {type} content
     * @returns {undefined}
     */
    Modal.prototype.setBody = function (content) {
        var $body = this.getBody();
        if (!$body.length) {
            this.getContent().append($(module.template.body));
            $body = this.getBody();
        }
        $body.html(content);
    };

    /**
     * Retrieves the modal-header element
     * @returns {humhub.ui.modal_L18.Modal.prototype@pro;$modal@call;find}
     */
    Modal.prototype.getHeader = function () {
        return this.$modal.find('.modal-header');
    };

    /**
     * Retrieves the modal-body element
     * @returns {humhub.ui.modal_L18.Modal.prototype@pro;$modal@call;find}
     */
    Modal.prototype.getBody = function () {
        return this.$modal.find('.modal-body');
    };
    
    var ConfirmModal = function(id) {
        Modal.call(this, id);
    };
    
    object.inherits(ConfirmModal, Modal);
    
    ConfirmModal.prototype.open = function(cfg) {
        cfg = cfg || {};
        this.clear();
        cfg['header'] = cfg['header'] || config['defaultConfirmHeader'];
        cfg['body'] = cfg['body'] || config['defaultConfirmBody'];
        cfg['confirmText'] = cfg['confirmText'] || config['defaultConfirmText'];
        cfg['cancleText'] = cfg['cancleText'] || config['defaultCancelText'];
        this.setTitle(cfg['header']);
        this.setBody(cfg['body']);
        this.initButtons(cfg);
        this.show();
    };
    
    ConfirmModal.prototype.clear = function(cfg) {
        this.$modal.find('[data-modal-confirm]').off('click');
        this.$modal.find('[data-modal-cancel]').off('click');
    };
    
    ConfirmModal.prototype.initButtons = function(cfg) {
        //Set button text
        var $cancelButton = this.$modal.find('[data-modal-cancel]');
        $cancelButton.text(cfg['cancleText']);
        
        var $confirmButton = this.$modal.find('[data-modal-confirm]');
        $confirmButton.text(cfg['confirmText']);
        
        //Init handler
        var that = this;
        if(cfg['confirm']) {
            $confirmButton.one('click', function(evt) {
                that.clear();
                cfg['confirm'](evt);
            });
        }

        if(cfg['cancel']) {
            $cancelButton.one('click', function(evt) {
                that.clear();
                cfg['cancel'](evt);
            });
        }
    };
    
    module.export({
        init: function () {
            module.global = new Modal('globalModal');
            module.globalConfirm = new ConfirmModal('globalModalConfirm');
            module.confirm = function(cfg) {
                module.globalConfirm.open(cfg);
            };
        },
        Modal: Modal,
        template: template
    });
});