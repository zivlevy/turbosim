import { TurbosimPage } from './app.po';

describe('turbosim App', function() {
  let page: TurbosimPage;

  beforeEach(() => {
    page = new TurbosimPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
