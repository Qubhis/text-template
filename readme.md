# Text Templates with Variables

This application is simple application which allows you to save and manage various templates with a variables. Most commonly used for a text which is often used with different values for the variables. A good example of such templates are prompts for LLM. This app allows you to select a template, provide values for variables, and copy the final text in desired format (markdown or text without formatting).

## Scope of the application

Application will be written in TypeScript since we want to provide an UI, and easiest way is via a browser.

### 0. Functionality

1. template storage:
   - save
   - edit
   - delete
2. variables in text:
   - variables in a text gonna be defined with `{{variable}}`
   - for every variable in a text a respective input field gonna be generated for value assignment
   - dropdown variables are defined as `{{variable:option1|option2|option3}}`
3. List of templates:
   - a page with list of existing templates
   - a button for a template creation
   - each template should have an unique title which is displayed in the list of templates, and the actual text template area where the template text is defined/displayed (but that text is displayed elsewhere - see the next point).
   - a selection of template opens the template text in another area with as many input fields as there are variables in the template
   - the area with the template provides a button to edit the template (pencil button), and a button to delete the template. The deletion must be always confirmed via a dialog.
   - the edit mode shows the template in unformatted way (e.g., markdown syntax if user creates a template with markdown specific syntax)
   - the display mode (area) shows the template with variable values in a formatted way (user friendly display)
   - there can be only a main page with the list in a column on the left side of the page, taking around 25% of displayed area
   - the other part is reserved the for template text - would that be a good idea for UI and UX?
4. additional features
   - I think that providing some way of categorizing or grouping a templates would be beneficial for users
   - Support for different markup languages, such as the one used in JIRA tool, for displaying and copying text (should be a dropdown)
   - provide a conditional template parts - we should take an inspiration from other tools such as Jinja or similar where conditionals are allowed - but it should be very easy for users to use!

### 1. Database

We don't need to go with an overkill for this application and thus we gonna use the most available database in a world - SQLite

### 2. Frontend

We should strive for as minimal as possible frontend application. I'm not sure if React is the best choice here - but let's discuss, I'm open to suggestions and ideas.

### 3. Backend

Since this application will be run totally locally, in a docker container, for such small scope of the application a backend would be unnecessary, and maybe we are enough with frontend application only?
