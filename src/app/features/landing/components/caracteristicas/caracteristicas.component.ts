import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({selector:'app-caracteristicas',standalone:true,imports:[CommonModule],templateUrl:'./caracteristicas.component.html',styleUrl:'./caracteristicas.component.css'})
export class CaracteristicasComponent {features=[['01','Solicitudes digitales','Presenta información desde un formulario organizado.'],['02','Proceso guiado','Visualiza los datos que necesitas completar.'],['03','Experiencia responsive','Accede desde computadora, tablet o celular.']];}
