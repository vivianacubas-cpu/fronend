import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({selector:'app-beneficios',standalone:true,imports:[CommonModule],templateUrl:'./beneficios.component.html',styleUrl:'./beneficios.component.css'})
export class BeneficiosComponent {items=[['01','Presentación digital','Envía tu solicitud sin desplazamientos innecesarios.'],['02','Información clara','Conoce los pasos y requisitos de cada trámite.'],['03','Seguimiento','Consulta el estado de tu solicitud de manera ordenada.'],['04','Atención institucional','Mantén tus datos y medios de contacto actualizados.']];}
