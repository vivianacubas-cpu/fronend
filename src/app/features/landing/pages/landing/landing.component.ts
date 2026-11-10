import { Component } from '@angular/core';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { BeneficiosComponent } from '../../components/beneficios/beneficios.component';
import { NosotrosComponent } from '../../components/nosotros/nosotros.component';
import { CaracteristicasComponent } from '../../components/caracteristicas/caracteristicas.component';
import { ContactoComponent } from '../../components/contacto/contacto.component';
import { FooterComponent } from '../../components/footer/footer.component';
@Component({selector:'app-landing',standalone:true,imports:[NavbarComponent,HeroComponent,BeneficiosComponent,NosotrosComponent,CaracteristicasComponent,ContactoComponent,FooterComponent],templateUrl:'./landing.component.html',styleUrl:'./landing.component.css'})
export class LandingComponent {}
