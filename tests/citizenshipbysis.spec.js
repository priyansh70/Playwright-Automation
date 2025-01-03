const { test, expect, chromium, firefox, webkit } = require('@playwright/test');


const { locators } = require('../constants/locators');
import { citizenshipbysis } from '../constants/locators';

const path = require('path');
const fs = require('fs');
import * as dotenv from "dotenv";
import { faker } from '@faker-js/faker';

// Generate a random first name, last name, and combine them in an email
const BeneficiaryfirstName = faker.person.firstName('male');
const BeneficiarylastName = faker.person.lastName('male');
const email = faker.internet.email({ BeneficiaryfirstName, BeneficiarylastName, provider: 'yopmail.com' })


// Nigerian phone numbers start with prefixes such as 080, 081, 090, 070 followed by 7 digits
// Generate a phone number in the format +234XXXXXXXXXX

function generateNigerianPhoneNumber() {
    // Array of valid prefixes
    const prefixes = ['803', '806', '813']; // Common prefixes for Nigerian networks

    // Randomly select a prefix from the array
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];

    const randomPhoneBody = faker.string.numeric(7); // Generate a 7-digit number
    return `+234-${randomPrefix}-${randomPhoneBody.slice(0, 4)} ${randomPhoneBody.slice(4)}`; // Format the number
}

const phone = generateNigerianPhoneNumber()
const formData = {
    BeneficiaryfirstName,
    BeneficiarylastName,
    email,
    phone
};

dotenv.config();

const LOGIN_URL = process.env.LOGIN_URL;
const LOGIN_EMAIL = process.env.LOGIN_EMAIL1;
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD1;
const LOGIN_PASSWORD_SECONDARY = process.env.LOGIN_PASSWORD_SECONDARY;
const MY_APPLICATION_URL = process.env.MY_APPLICATION_URL;


async function slowScrollTopBottom(page) {
    const scrollY = 500;
    const timeoutScroll = 500;

    // Get the total height of the page
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);

    // Scroll down until the bottom of the page
    for (let currentPosition = 0; currentPosition + viewportHeight < pageHeight; currentPosition += scrollY) {
        await page.evaluate((scrollY) => window.scrollBy(0, scrollY), scrollY);
        await page.waitForTimeout(timeoutScroll);
    }

    // Scroll back to the top of the page
    for (let currentPosition = pageHeight; currentPosition > 0; currentPosition -= scrollY) {
        await page.evaluate((scrollY) => window.scrollBy(0, -scrollY), scrollY);
        await page.waitForTimeout(timeoutScroll);
    }

    // Ensure final scroll is back to the top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(timeoutScroll);
}



const screenshotDir = path.join(__dirname, '../Screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}





test.describe.configure({ mode: 'serial' });
test.describe('Apply For Citizenship', () => {
    let browser;
    let context;
    let page;

    test.beforeAll(async () => {
        // Setup browser and context manually
        browser = await chromium.launch();
        context = await browser.newContext();
        page = await context.newPage();

        // Navigate to the login page
        await page.goto(LOGIN_URL);

        // Click on LOGIN link and complete login steps
        await page.getByRole('link', { name: 'LOGIN' }).click();
        await page.getByRole('textbox', { name: 'Enter your Password' }).fill(LOGIN_PASSWORD_SECONDARY);
        await page.getByRole('button', { name: 'Login' }).click();
        await page.getByRole('button', { name: 'Continue' }).click();

        // Secondary login if necessary
        await page.waitForSelector('text=Login');
        await page.getByRole('link', { name: 'Login' }).click();
        await page.getByLabel('* Email Address').type(LOGIN_EMAIL, { delay: 100 });
        await page.getByLabel('* Password').type(LOGIN_PASSWORD, { delay: 100 });
        await page.getByLabel('* Password').press('Enter');
        await page.getByRole('button', { name: 'Continue' }).click();

        await page.locator('#defaultNavbar1').getByText('Citizenship', { exact: true }).click();
        await page.getByRole('link', { name: 'Apply For Citizenship' }).click();
        await page.getByRole('heading', { name: 'Citizenship By Naturalization' }).click();
        await page.getByRole('heading', { name: 'Application for Special Immigrant Status (SIS)' }).click();
        await page.getByRole('link', { name: 'Proceed' }).click();
    });

    test.afterAll(async () => {
        await browser.close();
    });

    test.afterEach(async () => {
        // Reload page after each test to reset the state
        await page.reload();
    });

    //Leave all mandatory field blank
    test('TC 1: Leave all mandatory field blank', async () => {
        

        await page.getByRole('link', { name: 'Proceed' }).click();
        const errorMessageLocator = page.locator('text=Please complete all the required field(s).');
        await expect(errorMessageLocator).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(screenshotDir, 'citizenshipbysisleaveallfieldempty.png'), fullPage: true });
        console.log('Screenshot saved as citizenshipbysisleaveallfieldempty.png');
        await expect(errorMessageLocator).toHaveText('Please complete all the required field(s).');

        await page.getByRole('link', { name: 'Ok' }).click();



    });

      //Invalid file type
      test('TC 2: Invalid file type', async () => {
        
        await page.getByText('No', { exact: true }).click();
        const choice = Math.random() < 0.5 ? 'Yes' : 'No';

        if (choice === 'Yes') {
            await page.getByLabel('Yes').check();
            console.log('Yes')
        } else {
            await page.getByText('No', { exact: true }).click();
            await page.type(citizenshipbysis.RelationshipwithBenefactor, 'Student');
            console.log('No')
        }

        //Personal Information
        await page.getByRole('heading', { name: 'Personal Information' }).click();
        await page.waitForTimeout(2000);
        // Check if some content within the dropdown is visible, e.g. Date of Birth field
        const isDropdownOpened = await page.locator(citizenshipbysis.piDateOfBirth).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Personal Information' }).click();
        }
        await page.locator(citizenshipbysis.piDateOfBirth).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('1980');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.selectOption(citizenshipbysis.piBirthCountry, '161');
        await page.click(citizenshipbysis.piBirthCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piBirthState, '4');
        await page.type(citizenshipbysis.piCityOfBirth, 'Bauchi');
        await page.locator('#drpApplicantState').selectOption('24');
        await page.click(citizenshipbysis.piApplicantState);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piLocalarea, '1188');
        await page.locator(citizenshipbysis.piDateOfMarriage).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('2018');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.type(citizenshipbysis.piPlaceOfMarriage, 'Bauchi');
        await page.type(citizenshipbysis.piPreviousAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.piPreviousCountry, '161');
        await page.click(citizenshipbysis.piPreviousCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piPreviousState, '2');
        await page.type(citizenshipbysis.piPreviousCity, 'Cross River');
        await page.type(citizenshipbysis.piPresentAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.piPresentCountry, '161');
        await page.click(citizenshipbysis.piPresentCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piPresentState, '2');
        await page.type(citizenshipbysis.piPresentCity, 'Cross River');

        //Beneficiary Information
        await page.getByRole('heading', { name: 'Beneficiary\'s Information' }).click();
        await page.waitForTimeout(2000);
        // Check if some content within the dropdown is visible, e.g. Date of Birth field
        const isDropdownOpened1 = await page.locator(citizenshipbysis.BeneficiaryDateOfBirth).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened1) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Beneficiary\'s Information' }).click();
        }
        await page.type(citizenshipbysis.BeneficiaryLastName, formData.BeneficiarylastName);
        await page.type(citizenshipbysis.BeneficiaryFirstName, formData.BeneficiaryfirstName);
        await page.locator(citizenshipbysis.BeneficiaryDateOfBirth).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('1998');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.selectOption(citizenshipbysis.BeneficiaryPlaceOfBirthCountry, '161');
        await page.type(citizenshipbysis.BeneficiaryPlaceOfBirth, 'Cross River');
        await page.type(citizenshipbysis.BeneficiaryAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.BeneficiaryNationality, '161');
        await page.type(citizenshipbysis.BeneficiaryEmail, formData.email);
        await page.type(citizenshipbysis.BeneficiaryPhoneNumber, formData.phone);
        await page.type(citizenshipbysis.BeneficiaryPassportNumber, '15335345345435');

        //Professional Information
        await page.getByRole('heading', { name: 'Professional Information' }).click();
        await page.waitForTimeout(2000)
        const isDropdownOpened2 = await page.locator(citizenshipbysis.profOccupation).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened2) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Professional Information' }).click();
        }
        await page.type(citizenshipbysis.profOccupation, 'Student');
        await page.type(citizenshipbysis.profNameOfOrganization, 'Bauchi Univerisity');
        await page.type(citizenshipbysis.profOrganizationType, 'Educational');
        await page.type(citizenshipbysis.profPositionHeld, 'Student');
        await page.locator('#DivProfessionalInformation').getByRole('button').click();
        await page.getByRole('link', { name: 'Nigerian naira' }).click();
        await page.type(citizenshipbysis.profAnnualIncome, '98765214');

        //Reason for application
        await page.getByRole('heading', { name: 'Reason For Application' }).click();
        await page.type(citizenshipbysis.ReasonOfApplication, '98765214');

        //Document Upload
        await page.getByRole("heading", { name: "Documents Upload" }).click();
        await page.locator('li').filter({ hasText: '* Upload Passport Photograph' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Birth Certificate of' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: 'Upload Death Certificate' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Evidence Of Source' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Tax Clearance' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Resident Permit/' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: 'Upload Birth Certificate Of Children (If Any) Upload Upload Cancel' }).getByRole('textbox').setInputFiles('invalid-file.txt');       
        await page.locator('li').filter({ hasText: '* Upload Applicant’s Means of' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Marriage Certificate' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Formal application' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload Local Government' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator('li').filter({ hasText: '* Upload COPY OF SIGNED' }).getByRole('textbox').setInputFiles('invalid-file.txt');
        await page.locator(citizenshipbysis.marriagePhotograph).setInputFiles('invalid-file.txt');
        await page.type(citizenshipbysis.necessaryDocumentName, 'Student');
        await page.locator(citizenshipbysis.necessaryDocument).setInputFiles('invalid-file.txt');
        await page.waitForTimeout(2000);

        //Proceed button click
        await page.getByRole('link', { name: 'Proceed' }).click();
        const isVisible = await page.getByText('Please complete all the required field(s).').isVisible();
        if (isVisible) {
            await page.getByRole('link', { name: 'Ok' }).click();
            console.log('Message')
        } else {
            console.log("The text is not visible.");
        }
        const validationMessage = 'Please upload file with png/jpeg/pdf/word format';
        await expect(page.getByText(validationMessage).first()).toBeVisible({ timeout: 5000 });
        // Get the full text content of the page
        const pageText = await page.textContent('body');

        // Count occurrences of the sentence
        const sentenceCount = (pageText.match(new RegExp(validationMessage, 'g')) || []).length;

        console.log(`The sentence "${validationMessage}" appears ${sentenceCount} times.`);
        // Take a full-page screenshot
        await page.screenshot({ path: path.join(screenshotDir, 'citizenshipbysis_invalid_file.png'), fullPage: true });

        console.log('Screenshot saved as citizenshipbysis_invalid_file.png');


    });

    test('TC 3: all mandatory field ', async () => {
        
        await page.getByText('No', { exact: true }).click();
        const choice = Math.random() < 0.5 ? 'Yes' : 'No';

        if (choice === 'Yes') {
            await page.getByLabel('Yes').check();
            console.log('Yes')
        } else {
            await page.getByText('No', { exact: true }).click();
            await page.type(citizenshipbysis.RelationshipwithBenefactor, 'Student');
            console.log('No')
        }

        //Personal Information
        await page.getByRole('heading', { name: 'Personal Information' }).click();
        await page.waitForTimeout(2000);
        // Check if some content within the dropdown is visible, e.g. Date of Birth field
        const isDropdownOpened = await page.locator(citizenshipbysis.piDateOfBirth).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Personal Information' }).click();
        }
        await page.locator(citizenshipbysis.piDateOfBirth).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('1980');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.selectOption(citizenshipbysis.piBirthCountry, '161');
        await page.click(citizenshipbysis.piBirthCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piBirthState, '4');
        await page.type(citizenshipbysis.piCityOfBirth, 'Bauchi');
        await page.locator('#drpApplicantState').selectOption('24');
        await page.click(citizenshipbysis.piApplicantState);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piLocalarea, '1188');
        await page.locator(citizenshipbysis.piDateOfMarriage).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('2018');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.type(citizenshipbysis.piPlaceOfMarriage, 'Bauchi');
        await page.type(citizenshipbysis.piPreviousAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.piPreviousCountry, '161');
        await page.click(citizenshipbysis.piPreviousCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piPreviousState, '2');
        await page.type(citizenshipbysis.piPreviousCity, 'Cross River');
        await page.type(citizenshipbysis.piPresentAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.piPresentCountry, '161');
        await page.click(citizenshipbysis.piPresentCountry);
        await page.keyboard.press('Escape');
        await page.selectOption(citizenshipbysis.piPresentState, '2');
        await page.type(citizenshipbysis.piPresentCity, 'Cross River');

        //Beneficiary Information
        await page.getByRole('heading', { name: 'Beneficiary\'s Information' }).click();
        await page.waitForTimeout(2000);
        // Check if some content within the dropdown is visible, e.g. Date of Birth field
        const isDropdownOpened1 = await page.locator(citizenshipbysis.BeneficiaryDateOfBirth).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened1) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Beneficiary\'s Information' }).click();
        }
        await page.type(citizenshipbysis.BeneficiaryLastName, formData.BeneficiarylastName);
        await page.type(citizenshipbysis.BeneficiaryFirstName, formData.BeneficiaryfirstName);
        await page.locator(citizenshipbysis.BeneficiaryDateOfBirth).click();
        await page.locator('#ui-datepicker-div').getByRole('combobox').nth(1).selectOption('1998');
        await page.locator('#ui-datepicker-div').getByRole('combobox').first().selectOption('10');
        await page.getByRole('link', { name: '6', exact: true }).click();
        await page.selectOption(citizenshipbysis.BeneficiaryPlaceOfBirthCountry, '161');
        await page.type(citizenshipbysis.BeneficiaryPlaceOfBirth, 'Cross River');
        await page.type(citizenshipbysis.BeneficiaryAddress, 'Cross River');
        await page.selectOption(citizenshipbysis.BeneficiaryNationality, '161');
        await page.type(citizenshipbysis.BeneficiaryEmail, formData.email);
        await page.type(citizenshipbysis.BeneficiaryPhoneNumber, formData.phone);
        await page.type(citizenshipbysis.BeneficiaryPassportNumber, '15335345345435');

        //Professional Information
        await page.getByRole('heading', { name: 'Professional Information' }).click();
        await page.waitForTimeout(2000)
        const isDropdownOpened2 = await page.locator(citizenshipbysis.profOccupation).isVisible();
        // If the content is not visible (dropdown did not open), click again
        if (!isDropdownOpened2) {
            console.log('Dropdown not opened, clicking again...');
            await page.getByRole('heading', { name: 'Professional Information' }).click();
        }
        await page.type(citizenshipbysis.profOccupation, 'Student');
        await page.type(citizenshipbysis.profNameOfOrganization, 'Bauchi Univerisity');
        await page.type(citizenshipbysis.profOrganizationType, 'Educational');
        await page.type(citizenshipbysis.profPositionHeld, 'Student');
        await page.locator('#DivProfessionalInformation').getByRole('button').click();
        await page.getByRole('link', { name: 'Nigerian naira' }).click();
        await page.type(citizenshipbysis.profAnnualIncome, '98765214');

        //Reason for application
        await page.getByRole('heading', { name: 'Reason For Application' }).click();
        await page.type(citizenshipbysis.ReasonOfApplication, '98765214');

        //Document Upload
        await page.getByRole("heading", { name: "Documents Upload" }).click();
        await page.locator('li').filter({ hasText: '* Upload Passport Photograph' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Birth Certificate of' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: 'Upload Death Certificate' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Evidence Of Source' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Tax Clearance' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Resident Permit/' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: 'Upload Birth Certificate Of Children (If Any) Upload Upload Cancel' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');       
        await page.locator('li').filter({ hasText: '* Upload Applicant’s Means of' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Marriage Certificate' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Formal application' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload Local Government' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator('li').filter({ hasText: '* Upload COPY OF SIGNED' }).getByRole('textbox').setInputFiles('Dummy_PDF.pdf');
        await page.locator(citizenshipbysis.marriagePhotograph).setInputFiles('Dummy_PDF.pdf');
        await page.type(citizenshipbysis.necessaryDocumentName, 'Student');
        await page.locator(citizenshipbysis.necessaryDocument).setInputFiles('Dummy_PDF.pdf');
        await page.waitForTimeout(2000);
        //Proceed button click
        await page.getByRole('link', { name: 'Proceed' }).click();
        const isVisible = await page.getByText('You have successfully').isVisible();
        if (isVisible) {
            console.log('Success Message')
        } else {
            console.log("The text is not visible.");
        }
        //await page.getByRole('link', { name: 'Submit' }).click();
   
        // For payment
        // await page.getByLabel('The information provided').check();
        // await page.getByRole('button', { name: 'Proceed To Payment' }).click();
        // await page.getByRole('link', { name: 'Ok' }).click();

    });

});