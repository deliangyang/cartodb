var FiltersView = require('new_dashboard/filters_view');
var Router = require('new_dashboard/router');
var LocalStorage = require('new_common/local_storage');
var Backbone = require('backbone');
var $ = require('jquery');

describe('new_dashboard/filters_view', function() {
  beforeEach(function() {
    spyOn(cdb.config, 'prefixUrl');
    cdb.config.prefixUrl.and.returnValue('/u/paco');

    this.user = new cdb.admin.User({ username: 'paco' });
    this.router = new Router({ rootUrl: '' });
    this.router.model.set({
      content_type: 'datasets'
    });

    spyOn(this.router.model, 'bind').and.callThrough();

    this.collection = new cdb.admin.Visualizations();
    spyOn(this.collection, 'bind').and.callThrough();

    this.localStorage = new LocalStorage('test');

    this.deleteItemsDialogStub = jasmine.createSpyObj('DeleteItemsDialog stub', ['appendToBody']);
    this.DeleteItemsDialogSpy = jasmine.createSpy('DeleteItemsDialog');
    this.DeleteItemsDialogSpy.and.returnValue(this.deleteItemsDialogStub);
    FiltersView.__set__('DeleteItemsDialog', this.DeleteItemsDialogSpy);

    this.view = new FiltersView({
      user:         this.user,
      router:       this.router,
      collection:   this.collection,
      localStorage: this.localStorage 
    });

    // Helper method to get current html rendered
    this.html = function() {
      return this.view.el.innerHTML;
    }
  });

  describe('render', function() {

    describe('regular user', function() {

      it('shouldn\'t show shared datasets link because user doesn\'t belong to an org', function() {
        this.view.render();
        expect(this.view.$('.Filters-typeItem').length).toBe(5);
        expect(this.view.$el.html()).not.toContain('datasets/shared');
        expect(this.view.$('.Filters-orderItem').length).toBe(3);
      });
    });

    describe('organization', function() {

      it('should show shared datasets link if user belongs to an org', function() {
        var userMock = sinon.mock(this.user);
        userMock.expects('isInsideOrg').returns('true');
        this.view.render();
        expect(this.view.$('.Filters-typeItem').length).toBe(6);
        expect(this.view.$el.html()).toContain('shared');
        expect(this.view.$('.Filters-orderItem').length).toBe(3);
      });
    });

  });

  it('should render on change events by router model', function() {
    var args = this.router.model.bind.calls.argsFor(0);
    expect(args[0]).toEqual('change');
    expect(args[1]).toEqual(this.view.render);
    expect(args[2]).toEqual(this.view);
  });

  it('should change order with one is clicked', function() {
    this.view.render();
    this.view.$('.Filters-orderLink.js-likes').click();
    expect(this.localStorage.get('dashboard.order')).toBe('likes');
  });

  it('should show search when it is present in the route', function() {
    this.router.model.set('q', 'test');
    expect(this.view.$el.hasClass('search--enabled')).toBeTruthy();
    this.router.model.set('q', '');
    expect(this.view.$el.hasClass('search--enabled')).toBeFalsy();
    this.router.model.set('tag', 'paco');
    expect(this.view.$el.hasClass('search--enabled')).toBeTruthy();
    this.router.model.set('tag', '');
    expect(this.view.$el.hasClass('search--enabled')).toBeFalsy();
    this.router.model.set({ tag: 'tagg', search: 'paco' });
    expect(this.view.$el.hasClass('search--enabled')).toBeTruthy();
  });

  it('should hide search when click outside and it is not set', function() {
    this.view.render();
    this.view.$('.Filters-searchLink').click();
    expect(this.view.$el.hasClass('search--enabled')).toBeTruthy();
    cdb.god.trigger('closeDialogs');
    expect(this.view.$el.hasClass('search--enabled')).toBeFalsy();
  });

  describe('an item is selected', function() {
    beforeEach(function() {
      this.collection.reset({ selected: false });
      spyOn(this.view, '_animate').and.callThrough();
      this.collection.at(0).set('selected', true);
    });

    it('should do a animated render', function() {
      expect(this.view._animate).toHaveBeenCalled();
    });

    it('should mark the item as selected', function() {
      expect(this.view.$el.hasClass('items--selected')).toBeTruthy();
    });

    it('should show delete items', function() {
      expect(this.html()).toContain('Delete');
    });
    
    describe('and click delete_items', function() {
      beforeEach(function() {
        this.view.$('.js-delete').click();
      });

      it('should open a delete-items dialog', function() {
        expect(this.deleteItemsDialogStub.appendToBody).toHaveBeenCalled();
      });

      it('should created delete-items dialog with router and collection', function() {
        var createdWith = this.DeleteItemsDialogSpy.calls.argsFor(0)[0];
        expect(createdWith).toEqual(jasmine.objectContaining({ controller: this.controller }));
        expect(createdWith).toEqual(jasmine.objectContaining({ router: this.router }));
      });
    });
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
