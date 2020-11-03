Double Agent is a suite of tools written to allow a scraper engine to test if it is detectable when trying to blend into the most common web traffic.

Each test suite measures ways to detect a specific part of a scraper stack. Most detection techniques presented compare a user agent’s browser and operating system to the capabilities detectable in a given page load.

Mostly, these tests detect when a user agent is not who it claims to be.

## Mainstream Scraper Detections:

This version of Double Agent tests how many ways scrapers can be detected when emulating browser/OS desktop combos. Future versions will integrate mobile browsers.

Scrapers often choose a strategy of rotating user agents using a library, or picking a few popular browsers and rotating between those. This suite tests both strategies.

1. **Random:** randomly generated useragents using the Intoli [user-agents](https://github.com/intoli/user-agents) package
2. **Popular:** rotate between the useragents that comprise more than 50% of web traffic according to [StatCounter.com](https://gs.statcounter.com/)

For a dynamic approach to exploring results, visit [State of Scraping](https://stateofscraping.org).

## Structure:

This suite is broken up by the layers of a browser request. Each layer has one or more plugins that tie into an overall set of pages loaded by a test runner. Each plugin first generates "profiles" of how known browsers behave loading the test pages. Any scraper is then compared to these "profiles" to find discrepancies. These checks are given a "bot score", or likelihood that the flagged check indicates the user agent is actually a bot.

- `/detections`: suite of tests
- `/runner`: a server that can generate step-by-step assignments for a scraper to run all tests
- `/profiler`: create profiles of real browsers running through the pages 

## Detections:

The list of detections is listed below (some tests are not yet implemented):

{{inject=output/detections.md}}

## Testing your Scraper Stack:

This project leverages yarn workspaces. To get started, run `yarn` from the root directory.

If you'd like to test out your scraper stack:

1. Navigate to the `/runner` directory and run `yarn start`. Follow setup directions print onto the console from this command. 

2. The API will return assignments one at a time until all tests have been run. Include a scraper engine you're testing with
   a query string or header called "scraper". Assignment format can be found at `/runner/interfaces/IAssignment.ts`.

3. Once all tests are run, results will be output to the same directory as your scraper engine.

Popular scraper examples can be found in the [scraper-report](https://github.com/ulixee/scraper-report) repo.
