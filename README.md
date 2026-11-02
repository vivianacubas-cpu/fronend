Sistema FUT – Alfonso Ugarte

1. Descripción del proyecto

El Sistema FUT – Alfonso Ugarte es una aplicación web desarrollada para gestionar de manera organizada las solicitudes de Formularios Únicos de Trámite (FUT) de la Institución Educativa N.° 20191 "Alfonso Ugarte", ubicada en San Vicente.

El sistema permite registrar solicitantes, gestionar trámites, consultar solicitudes y realizar el seguimiento de su estado.

2. Tecnologías utilizadas

Angular 20

TypeScript

HTML5

CSS3

Node.js 22

Angular CLI

3. Arquitectura del proyecto

El frontend utiliza una arquitectura Feature-Based, organizada por funcionalidades para facilitar el mantenimiento y la escalabilidad.

src/
└── app/
    ├── core/
    ├── shared/
    ├── features/
    │   ├── auth/
    │   ├── fut/
    │   ├── home/
    │   ├── reports/
    │   ├── tracking/
    │   └── users/
    ├── app.component.ts
    ├── app.config.ts
    └── app.routes.ts

4. Requisitos previos

Node.js

npm

Angular CLI 20

Visual Studio Code

5. Instalación

Clonar el repositorio:

git clone https://github.com/vallegrande/ASE252S3_T05-fe.git

Ingresar al proyecto:

cd ASE252S3_T05-fe

Instalar dependencias:

npm install

6. Ejecución del proyecto

Iniciar el servidor de desarrollo:

ng serve

Abrir en el navegador:

http://localhost:4200

7. Compilación

Para generar la versión de producción:

ng build

8. Autoría

Proyecto académico desarrollado para la Institución Educativa N.° 20191 "Alfonso Ugarte".
