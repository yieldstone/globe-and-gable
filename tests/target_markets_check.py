"""Live public-listing check: run with python3 tests/target_markets_check.py."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

SHOTS = Path('/tmp/browser/target-markets')
SHOTS.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 1800})
        page = await context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.goto('http://localhost:8080/', wait_until='networkidle')
        await page.get_by_role('heading', name='Globe And Gable', exact=True).wait_for()
        cards = page.locator('a[href^="/properties/"]').filter(has=page.locator('h3'))
        await cards.first.wait_for()
        assert await cards.count() == 12
        for text in await cards.all_text_contents():
            assert any(city in text for city in ['New York', 'Miami', 'Los Angeles', 'Dubai', 'Abu Dhabi']), text
            assert not any(city in text for city in ['Paris', 'London', 'Bali', 'Berlin', 'Marbella', 'Sydney', 'Toronto', 'Zermatt', 'Lisbon']), text
        await page.screenshot(path=str(SHOTS / 'desktop.png'))
        for region, count in [('USA', 6), ('Dubai', 3), ('Abu Dhabi', 3)]:
            await page.goto(f'http://localhost:8080/properties?region={region.replace(" ", "%20")}', wait_until='networkidle')
            filtered = page.locator('a[href^="/properties/"]').filter(has=page.locator('h3'))
            await filtered.first.wait_for()
            assert await filtered.count() == count, (region, await filtered.count())
            print(region, count, 'listings verified')
        await page.get_by_role('link', name='Al Reem Island Sea View Residence', exact=False).click()
        await page.get_by_role('heading', name='Al Reem Island Sea View Residence', exact=True).wait_for()
        assert 'Abu Dhabi' in await page.locator('main').inner_text()
        assert '24.496' in await page.locator('iframe').get_attribute('src')
        assert await page.get_by_role('button', name='Schedule a viewing', exact=True).is_visible()
        await page.screenshot(path=str(SHOTS / 'detail.png'))
        await page.goto('http://localhost:8080/agencies', wait_until='networkidle')
        agency_text = await page.locator('main').inner_text()
        assert not any(city in agency_text for city in ['Paris', 'London', 'Bali', 'Berlin', 'Marbella', 'Sydney', 'Zermatt'])
        for url in ['/auth', '/post-listing', '/mortgage-calculator']:
            await page.goto('http://localhost:8080' + url, wait_until='networkidle')
            assert 'Globe And Gable' in await page.title()
            assert 'Atlas Estates' not in await page.locator('body').inner_text()
        await page.goto('http://localhost:8080/', wait_until='networkidle')
        await page.get_by_role('button', name='Language and currency').click()
        await page.get_by_role('menuitem', name='UAE Dirham (AED)').click()
        assert 'AED' in await cards.first.inner_text()
        for width in [390, 360]:
            await page.set_viewport_size({'width': width, 'height': 844})
            await page.screenshot(path=str(SHOTS / f'mobile-{width}.png'))
            assert await page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), width
            assert await page.get_by_role('button', name='Open menu').is_visible()
        assert not errors, errors
        print('12 target-market samples, maps, branding, AED prices and mobile layout verified; no runtime errors.')
        await browser.close()

asyncio.run(main())
