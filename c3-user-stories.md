Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1

As a CPSC student at UBC, I want to find all CPSC courses that have average lower than 65,
so that I avoid taking them.

#### Definitions of Done(s)
Scenario 1: Successfully find complete list of CPSC courses have average lower than 65 ordered by their averages from low to high

Given: On the filter page, the user clicks on the "courses" button, and uploads courses dataset to add courses dataset.

When: On the same filter page, the user checks "CPSC" from the "department" group, then checks "Department", "ID", "Average" from Columns group, and enters 70 in the input box,
and then checks "average" from "order by" group,
and finally clicks “View Results”.

Then: On the same page, the application presents the results in an alert box
containing all the CPSC courses that have average with their average from low to high.

Scenario 2: Fail to find any CPSC course that has average lower than 65 ordered by their averages

Given: On the filter page, the user does not click on the "courses" button and forgets to upload courses dataset, so courses dataset is not added.

When: On the same filter page, the user checks "CPSC" from the "department" group, then checks "Department", "ID", "Average" from Columns group, and enters 70 in the input box,
and then checks "average" from "order by" group,
and finally clicks “View Results”.

Then: On the same page, the application shows an alert message saying
saying "Oh no you haven't selected a dataset yet!"

## User Story 2

As an incoming Math student who is going to take Math310 next term, I want to find all information about math 310 so I can better prepare myself for this course.

#### Definitions of Done(s)
Scenario 1: Find all math courses information successfully

Given: On the search page, the user clicks on the "courses" button and uploads courses dataset to add courses dataset.

When:  On the same search page, the user enters "math310", and clicks "View Results"

Then: On a new page, the application presents the results in an alert box containing all math courses offered at UBC.

Scenario 2: Fail to find any math courses information

Given: On the search page, the user clicks on the "courses" button and uploads courses dataset to add courses dataset.

When: On the same search page, the user enters an invalid input "amth310", and clicks "View Results"

Then: The application remains on the filter page and the application shows an alert message
saying "Oh no please make sure you enter a valid keyword!"


## User Story 3
As a professor at UBC, I want to check the number of seats that each classroom has in a specific building,
so that I can determine which classroom to use.

#### Definitions of Done(s)
Scenario 1: Search for building information successfully

Given: On searching page, the user clicks on "rooms" button to search from UBC rooms

When: The user enters a valid building short name such as "DMP" and clicks “Search”

Then: On a new page, The application searches for the data and presents 
a list of rooms with the room number and number of seats in that building.

Scenario 2: Fail to find building information

Given: On searching page, the user clicks on "rooms" button to search from UBC rooms.

When: The user enters a name that does not exist in UBC buildings, and clicks “Search”

Then: The application remains on the searching page and shows an error 
in red telling the user to enter a valid building name
















