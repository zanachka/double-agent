import { By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
import IAssignment from '@double-agent/runner/interfaces/IAssignment';
import ISessionPage from "@double-agent/collect/interfaces/ISessionPage";

export default async function runAssignmentInWebDriver(
  driver: WebDriver,
  assignment: IAssignment,
  browserName: string,
  browserVersion: string,
) {
  const needsEnterKey = browserName == 'Safari' && browserVersion === '13.0';

  for (const pages of Object.values(assignment.pagesByPlugin)) {
    await runPluginPagesInWebdriver(driver, pages, needsEnterKey);
  }
}

async function runPluginPagesInWebdriver(driver: WebDriver, pages: ISessionPage[], needsEnterKey: boolean) {
  let prev: ISessionPage;
  for (const page of pages) {
    let currentUrl = await driver.getCurrentUrl();
    if (page.isRedirect) continue;
    if (prev && prev.clickElementSelector && currentUrl !== page.url) {
      // edge 18 takes forever to test codecs.. so need to wait a long time for page to load
      console.log(`URL ${currentUrl} SHOULD BE ${page.url}`);
      await driver.wait(until.urlIs(page.url), 60e3);
      currentUrl = await driver.getCurrentUrl();
    }

    if (page.url !== currentUrl) {
      console.log('Load page %s (was %s)', page.url, currentUrl);
      await driver.get(page.url);
      console.log(`Loaded ${page.url}`);
    }

    if (page.waitForElementSelector) {
      console.log('Wait for element %s on %s', page.waitForElementSelector, page.url);
      await waitForElement(driver, page.waitForElementSelector);
    } else {
      console.log('Wait for body on %s', page.url);
      await waitForElement(driver, 'body');
    }

    if (page.clickElementSelector) {
      console.log('Click element %s on %s', page.clickElementSelector, page.url);
      const elem = await waitForElement(driver, page.clickElementSelector);
      await driver.wait(until.elementIsVisible(elem));

      await clickElement(elem, driver, needsEnterKey);
    }
    prev = page;
  }
}

async function waitForElement(driver: WebDriver, cssSelector: string) {
  // try {
  return driver.wait(until.elementLocated(By.css(cssSelector)));
  // } catch(error) {
  //   console.log(`waitForElement Error: ${cssSelector}... `, error);
  //   await new Promise(r => setTimeout(r, 5000));
  // }
}

async function clickElement(elem: WebElement, driver: WebDriver, needsEnterKey: boolean) {
  if (needsEnterKey) {
    // safari 13.0 has a known bug where clicks don't work that's making this necessary
    await driver
      .actions()
      .mouseMove(elem)
      .click(elem)
      .perform();
    try {
      await elem.click();
    } catch (error) {
      console.log('Error: could not click')
    }
    try {
      await elem.sendKeys(Key.RETURN);
    } catch (error) {
      console.log('Error: could not sendKeys')
    }
  } else {
    await elem.click();
  }
}

export async function createNewWindow(driver: WebDriver) {
  console.log('Opening new window');
  await driver.executeScript('window.open()');
  await driver.close();
  const handles = await driver.getAllWindowHandles();
  await driver.switchTo().window(handles.pop());
}
