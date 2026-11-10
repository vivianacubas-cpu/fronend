import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({selector:'app-tramite-form',standalone:true,imports:[CommonModule,ReactiveFormsModule],templateUrl:'./tramite-form.component.html',styleUrl:'./tramite-form.component.css'})
export class TramiteFormComponent {
  enviado=false; codigo='';
  form=this.fb.group({nombre:['',[Validators.required,Validators.minLength(3)]],dni:['',[Validators.required,Validators.pattern(/^[0-9]{8}$/)]],correo:['',[Validators.required,Validators.email]],telefono:['',[Validators.pattern(/^[0-9]{9}$/)]],tipo:['Solicitud general',Validators.required],asunto:['',[Validators.required,Validators.minLength(5)]],detalle:['',[Validators.required,Validators.minLength(15)]]});
  constructor(private fb:FormBuilder){}
  enviar(){if(this.form.invalid){this.form.markAllAsTouched();return;} this.codigo='FUT-2026-'+Math.floor(1000+Math.random()*9000);this.enviado=true;window.scrollTo({top:0,behavior:'smooth'});}
  nuevo(){this.enviado=false;this.form.reset({tipo:'Solicitud general'});}
}
