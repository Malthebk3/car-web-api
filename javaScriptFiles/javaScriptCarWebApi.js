import { IS_LOG_ENABLED } from '../javaScriptFiles/javaScriptSettings.js'
let MAIN_URL = "https://h2pd080126.buchwaldshave34.dk";

let API_URL = MAIN_URL + "/api/CarFamily"; // OPDATÉR MED DIN API URL
let SWAGGER_URL = MAIN_URL + "/swagger/index.html";
let LOGINFO_URL = MAIN_URL + "/api/loginfo";
let DATABASEINFO_URL = MAIN_URL + "/api/databaseinfo";

const ForklaringsTekst = "Åben link i et Browser Tab for at blive klogere på ServerSide info/opbygning !!!";
const UrlsToInfo = [
    ["Api", API_URL, ForklaringsTekst],
    ["Swagger", SWAGGER_URL, ForklaringsTekst],
    ["Log Info", LOGINFO_URL, ForklaringsTekst],
    ["Database Info", DATABASEINFO_URL, ForklaringsTekst],
];


const MIN_USERNAME_LENGTH = 3;
const textBoxEmptyString = '';
const noCarModelString = '     ';

// Globale variabler
let USER_NAME = 'Default VSCode User';
let CarArray = [];
let CarElevvisning;

let nextCarId = 1; // Start ID for nye biler
let editingCarId = null; // ID for den bil, der redigeres
let tableEditingRow = null; 
let addButton;
let cancelButton;

class FormField {
    constructor(id, defaultValue) {
        this.id = id;
        this.defaultValue = defaultValue;
    }

    getElement() {
        return document.getElementById(this.id);
    }

    getValue() {
        const element = this.getElement();
        return element ? element.value : null;
    }

    setValue(value) {
        const element = this.getElement();
        if (element) {
            element.value = value;
        }
    }

    clearValue() {
        this.setValue(textBoxEmptyString);
    }
}

class FormFields {
    static CarName = new FormField('txtCarName', 'Indtast Car Navn');
    static CarYear = new FormField('txtCarYear', 'Indtast Car Year');
    static CarPrice = new FormField('txtCarPrice', 'Indtast Car Price');
    static CarModel = new FormField('txtCarModel', 'Indtast Car Model');

    static AllFields = Object.values(FormFields);
}

class Car 
{
    static numberOfCarObjectsDefinedOnClass = 0;

    constructor(objectType,carId, carName, carYear, carPrice)
    {
        this.carName = carName;
        this.carYear = carYear;
        this.carPrice = carPrice;
        this.carId = carId;
        Car.numberOfCarObjectsDefinedOnClass++;
    }

    carAge() {
        const date = new Date();
        return (date.getFullYear() - this.carYear);
    }

    copyEditedDataToSpecifiedCarObject(formData)
    {
        this.carName = formData.carName;
        this.carYear = formData.carYear;
        this.carPrice = formData.carPrice;
    }

    static decreaseNumberOfCarObjects()
    {
        if (Car.numberOfCarObjectsDefinedOnClass > 0)
        {
            Car.numberOfCarObjectsDefinedOnClass--;
        }
        else 
        {
            alert("Vi burde aldrig komme ind her i funktionen decreaseNumberOfCarObjects !!!");
        }
    }
    
    toString() {
        return ("Id : " + this.carId + " => Navn : " + this.carName + " => Årgang : " + this.carYear + " => Alder : " + this.carAge() + " år => Pris : " + this.carPrice + "kr");
    }
}

class CarModel extends Car 
{
    static numberOfCarModelObjectsDefinedOnClass = 0;

    constructor(objectType, carModel, carId, carName, carYear, carPrice) 
    {
        super(objectType, carId, carName, carYear, carPrice);
        this.carModel = carModel;
        CarModel.numberOfCarModelObjectsDefinedOnClass++;
    }

    static decreaseNumberOfCarModelObjects()
    {
        Car.decreaseNumberOfCarObjects();
        if (CarModel.numberOfCarModelObjectsDefinedOnClass > 0)
        {
            CarModel.numberOfCarModelObjectsDefinedOnClass--;
        }
        else 
        {
            alert("Vi burde aldrig komme ind her i funktionen decreaseNumberOfCarModelObjects !!!");
        }
    }

    toString() 
    {
        return (super.toString() + " => Model : " + this.carModel);
    }
}

// Et objekt der mapper $type-feltet til den korrekte JavaScript-klasse
const classMap = {
  'car': Car,
  'carModel': CarModel
};

function SaveUserNameToLocalStorage()
{
    USER_NAME = document.getElementById('user-name').value.trim();
    localStorage.setItem('USER_NAME', JSON.stringify(USER_NAME));
}

function LoadUserNameFromLocalStorage()
{
    const storedUserName = localStorage.getItem('USER_NAME');
    if (storedUserName) {
        USER_NAME = JSON.parse(storedUserName);
        return USER_NAME;
    }
    return 'Default VSCode User'; // Returner en standardværdi, hvis der ikke er gemt noget
}

// En funktion der opretter en ny instans baseret på et objekt
function createTypedInstance(item) {
  const ClassToInstantiate = classMap[item.$type];
  if (ClassToInstantiate) {
    // Spreder alle properties fra 'item' til en ny instans
    return new ClassToInstantiate(...Object.values(item));
  }
  // Returner null eller smid en fejl hvis typen ikke er genkendt
  return null; 
}

// Håndtering af Web API og data
// ---
// GET: Hent alle opgaver fra API'et
async function getItems() {
    const params = new URLSearchParams({ userName: USER_NAME });
    const url = `${API_URL}?${params.toString()}`;

    if (IS_LOG_ENABLED)
    {
        console.log(url);
    }   

    try {
        //const response = await fetch(url);
        const response = await fetch(url, {
            method: 'GET'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();

        // Map hvert råt objekt til en ny instans af den korrekte klasse
        const typedCars = rawData.map(item => createTypedInstance(item));

        // Fjern eventuelle null-værdier, hvis en type ikke blev fundet
        CarArray = typedCars.filter(item => item !== null); 

        if (IS_LOG_ENABLED)
        {
            console.log(CarArray);
        }
        
        // Elev test visning herunder !!!
        // CarElevvisning.innerHTML = "";
        // for (let counter = 0; counter < CarArray.length; counter++)
        // {
        //     CarElevvisning.innerHTML += CarArray[counter] + "<br />";       
        // }
    } catch (error) {
        console.error("Fejl ved hentning af data:", error);
    }
}

// POST: Tilføj en ny opgave
async function addItem(dataObject) {
    const params = new URLSearchParams({ userName: USER_NAME });
    const url = `${API_URL}?${params.toString()}`;
    
    const typedObject = {};
    
    // Det er vigtigt, at $type feltet er det første felt i typedObjekt 
    // objektet. Så derfor må koden laves som herunder.
    if ('undefined' !== typeof dataObject.carModel)
    {
        typedObject.$type = "carModel";
    }
    else
    {
        typedObject.$type = "car";
    }
    
    Object.assign(typedObject, dataObject);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typedObject)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        DisplayTableDataFromWebApi();
    } catch (error) {
        console.error("Fejl ved tilføjelse af data:", error);
    }
}

async function updateItem(carId, dataObject) {
    const params = new URLSearchParams({ userName: USER_NAME });
    const url = `${API_URL}/${carId}?${params.toString()}`;
    const typedObject = {};

    if ('undefined' !== typeof dataObject.carModel)
    {
        typedObject.$type = "carModel";
    }
    else
    {
        typedObject.$type = "car";
    }

    Object.assign(typedObject, dataObject);

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(typedObject)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        DisplayTableDataFromWebApi();
    } catch (error) {
        console.error("Fejl ved opdatering af data:", error);
    }
}

async function deleteItem(carId) {
    const params = new URLSearchParams({ userName: USER_NAME });
    const url = `${API_URL}/${carId}?${params.toString()}`;

    try {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        DisplayTableDataFromWebApi();
    } catch (error) {
        console.error("Fejl ved sletning af data:", error);
    }
}

function AddNewCarOrCarModel(event)
{
    // Forhindrer formularen i at genindlæse siden
    event.preventDefault(); 

    const allFields = FormFields.AllFields;

    // 1. Isoler felterne der skal valideres (alle på nær det sidste)
    const fieldsToValidate = allFields.slice(0, -1);

    // 2. Tjek om alle de isolerede felter er udfyldt
    const allRequiredFieldsAreFilled = fieldsToValidate.every(field => field.getValue().trim() !== textBoxEmptyString);

    // Hvis ikke alle de første felter er udfyldt, afbryd og vis fejl
    if (!allRequiredFieldsAreFilled) 
    {
        alert("Fejl: Alle felter på nær det sidste skal udfyldes.");
        
        // Find det første ugyldige felt og sæt fokus på det
        const firstInvalidField = fieldsToValidate.find(field => field.getValue().trim() === textBoxEmptyString);
        if (firstInvalidField)
        {
            firstInvalidField.getElement().style.border = '2px solid red';
            firstInvalidField.getElement().focus();
        }
        return;
    }

    // Hvis de påkrævede felter er udfyldt, fortsæt med det sidste felt
    const lastField = allFields[allFields.length - 1];
    const lastFieldValue = lastField.getValue().trim();

    let formDataObject = {
        carName: FormFields.CarName.getValue(),
        carYear: FormFields.CarYear.getValue(),
        carPrice: FormFields.CarPrice.getValue(),
    };

    if (lastFieldValue !== textBoxEmptyString)
    {
        formDataObject.carModel = lastFieldValue;
    }

    if (editingCarId !== null) 
    {
        // REDIGERINGS-TILSTAND
        const carIndex = CarArray.findIndex(car => car.carId === editingCarId);
        if (carIndex !== -1) 
        {
            formDataObject.carId = editingCarId;
            updateItem(editingCarId, formDataObject);
        }
        resetEditingState();
    } 
    else 
    {
        addItem(formDataObject);
    }
    ClearTextFields();
}

function AddDataToTable(carObject)
{
    // Få fat i tbody-elementet i tabellen
    const tableBody = document.getElementById('data-table-body');
    
    // Opret en ny række (<tr>) og celler (<td>)
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-id', carObject.carId);

    const CarIdCell = document.createElement('td');
    CarIdCell.textContent = carObject.carId;
    
    const CarNameCell = document.createElement('td');
    CarNameCell.textContent = carObject.carName;
    
    const CarYearCell = document.createElement('td');
    CarYearCell.textContent = carObject.carYear;

    const CarAgeCell = document.createElement('td');
    CarAgeCell.textContent = carObject.carAge() + " år";
    
    const CarPriceCell = document.createElement('td');
    CarPriceCell.textContent = carObject.carPrice;

    const CarModelCell = document.createElement('td');
    if (carObject instanceof CarModel)
    {
        CarModelCell.textContent = carObject.carModel;
    }
    else 
    {
        CarModelCell.textContent = textBoxEmptyString;
    }
    
    const ActionsCell = document.createElement('td');

    // Opret "Slet"-knappen
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Slet';
    deleteButton.className = 'delete-btn';
    deleteButton.addEventListener('click', function() {
        // Fjerner den forælder-række, knappen er en del af
        const rowId = parseInt(newRow.getAttribute('data-id'));
        const carIndex = CarArray.findIndex(car => car.carId === rowId);
        
        if (carIndex !== -1) {
            // NY LOGIK: Hent objektet før det slettes, og opdatér den statiske tæller
            const carToDelete = CarArray[carIndex];
            // if (carToDelete instanceof CarModel) {
            //     CarModel.decreaseNumberOfCarModelObjects();
            // } else if (carToDelete instanceof Car) {
            //     Car.decreaseNumberOfCarObjects();
            // }

            deleteItem(carToDelete.carId);
        }
    });

    // Opret "Ret"-knappen
    const editButton = document.createElement('button');
    editButton.textContent = 'Ret';
    editButton.className = 'edit-btn';
    editButton.addEventListener('click', function() {
        // Sæt editingRow til den række, der skal rettes
        tableEditingRow = newRow;

        addButton.value = 'Ret Car eller Car Model';
        cancelButton.style.display = 'inline-block'; // Vis annuller-knappen

        const rowId = parseInt(newRow.getAttribute('data-id'));
        
        editingCarId = rowId;

        // Få fat i dataen fra den række, der skal rettes
        const rowData = {
            carName: CarNameCell.textContent,
            carYear: CarYearCell.textContent,
            carPrice: CarPriceCell.textContent,
            carModel: CarModelCell.textContent
        };
        
        // Indsæt dataen i formularfelterne med din klasse
        FormFields.CarName.setValue(rowData.carName);
        FormFields.CarYear.setValue(rowData.carYear);
        FormFields.CarPrice.setValue(rowData.carPrice);
        FormFields.CarModel.setValue(rowData.carModel);
    });

    // Tilføj knapperne til handlingscellen
    ActionsCell.appendChild(deleteButton);
    ActionsCell.appendChild(editButton);

    // Tilføj alle celler til den nye række
    newRow.appendChild(CarIdCell);
    newRow.appendChild(CarNameCell);
    newRow.appendChild(CarYearCell);
    newRow.appendChild(CarAgeCell);
    newRow.appendChild(CarPriceCell);
    newRow.appendChild(CarModelCell);
    newRow.appendChild(ActionsCell);

    // Tilføj den nye række til tabellen
    tableBody.appendChild(newRow);
    
    ClearTextFields();
}

function ClearTextFields()
{
    // Tøm formularfelterne efter tilføjelse eller editering. Eller efter tryk på 
    // Tøm Tekstfelter knappen.
    FormFields.AllFields.forEach(field => field.clearValue());
}

function resetEditingState() 
{
    editingCarId = null;
    tableEditingRow = null;
    addButton.value = 'Tilføj Car eller Car Model';
    ClearTextFields();
    cancelButton.style.display = 'none'; // Skjul annuller-knappen
}

function UpdateObjectCounterTags()
{
    document.getElementById("total-count").innerHTML = "Antal Car objekter = " + Car.numberOfCarObjectsDefinedOnClass + " Antal CarModel objekter = " + CarModel.numberOfCarModelObjectsDefinedOnClass;
}

async function DisplayTableDataFromWebApi()
{
    Car.numberOfCarObjectsDefinedOnClass = 0;
    CarModel.numberOfCarModelObjectsDefinedOnClass = 0;
    CarArray = []; // Ryd CarArray før hentning af data
    document.getElementById('data-table-body').innerHTML = ''; // Ryd tabellen før hentning af data
    await getItems();

    CarArray.forEach(Car => {
        AddDataToTable(Car);
    });
    UpdateObjectCounterTags();
}

export function init_javaScriptCarWebAPi()
{
    const tbody = document.getElementById('table-body-urls');
    tbody.innerHTML = '';
    for (let counter = 0; counter < UrlsToInfo.length; counter++)
    {
        const raekke = UrlsToInfo[counter];
        const row = tbody.insertRow();

        const UrlContentCell = row.insertCell(0);
        UrlContentCell.textContent = raekke[0];

        const UrlCell = row.insertCell(1);
        UrlCell.textContent = raekke[1];
        
        const ForklaringCell = row.insertCell(2);
        ForklaringCell.textContent = raekke[2];
    }

    const currentYear = new Date().getFullYear();
    const carYearMin = 1990;
    txtCarYear.setAttribute('type', 'number'); 
    txtCarYear.setAttribute('max', currentYear);
    txtCarYear.setAttribute('min', carYearMin); 

    const priceMin = 10000;
    txtCarPrice.setAttribute('type', 'number');
    txtCarPrice.setAttribute('step', 1000);
    txtCarPrice.setAttribute('min', priceMin);

    document.getElementById('btnUserName').addEventListener('click', SaveUserNameToLocalStorage);
    const UserNameInput = document.getElementById('user-name');
    UserNameInput.value =LoadUserNameFromLocalStorage();

    document.getElementById('btnAddCar').addEventListener('click', AddNewCarOrCarModel);
    addButton = document.getElementById('btnAddCar');

    // Få fat i den nye annuller-knap
    document.getElementById('cancel-button').addEventListener('click', resetEditingState);
    cancelButton = document.getElementById('cancel-button');

    document.getElementById('btnClearTextFields').addEventListener('click', ClearTextFields);

    document.getElementById('btnUserName').addEventListener('click', SaveUserNameToLocalStorage);
    const btnUserName = document.getElementById('btnUserName');

    const tableBody = document.getElementById('data-table-body');

    const textBoxEmptyString = '';
    const noCarModelString = '     ';
    let tableEditingRow = null; 
    
    // alert("Udvalgte funktioner er medtaget. Resten af funktionaliteten skal laves af elever !!!")
    

    CarElevvisning = document.getElementById("CarElevvisning");
    // Initialiser applikationen ved opstart
    DisplayTableDataFromWebApi();
    
}