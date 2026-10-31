import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TramiteFormComponent } from '../../components/tramite-form/tramite-form.component';
@Component({selector:'app-tramite',standalone:true,imports:[RouterLink,TramiteFormComponent],templateUrl:'./tramite.component.html',styleUrl:'./tramite.component.css'})
export class TramiteComponent {}
