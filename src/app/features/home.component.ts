import { Component } from '@angular/core'; 
import { RouterLink } from '@angular/router'; 
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',           
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent { 

  features = [
    { icon: '📋', title: 'Modèles personnalisés', desc: 'Créez vos propres modèles de maturité adaptés à votre domaine.' },
    { icon: '📊', title: 'Suivi en temps réel',   desc: 'Visualisez la progression de vos équipes sur chaque niveau.' },
    { icon: '👥', title: 'Gestion des équipes',   desc: 'Invitez vos membres et assignez-leur des évaluations.' },
    { icon: '🔒', title: 'Accès par rôle',        desc: 'PMO, Team Lead et Team Member ont chacun leur espace dédié.' },
    { icon: '⚡', title: 'Simple et rapide',       desc: 'Interface intuitive, prise en main en quelques minutes.' },
    { icon: '🧩', title: 'Multi-domaines',         desc: 'Scrum, Cybersécurité, Qualité, Agile, DevOps et plus encore.' },
  ];

  roles = [
    {
      icon: '🏆',
      name: 'PMO', 
      desc: 'Pilotez la stratégie de maturité de votre organisation.',
      perks: ['Créer des modèles', 'Gérer les équipes', 'Voir tous les résultats']
    },
    {
      icon: '👨‍💼',
      name: 'Team Lead',  
      desc: 'Gérez votre équipe et suivez sa progression.',
      perks: ['Inviter des membres', 'Assigner des évaluations', 'Suivre les résultats']
    },
    {
      icon: '👤',
      name: 'Team Member',  
      desc: 'Évaluez votre maturité et progressez.',
      perks: ['Répondre aux évaluations', 'Voir sa progression', 'Accéder aux modèles']
    },
  ];

  previewLevels = [
    { name: 'Initial',   fill: '20%', color: '#ef4444' },
    { name: 'Répétable', fill: '45%', color: '#f97316' },
    { name: 'Défini',    fill: '65%', color: '#eab308' },
    { name: 'Géré',      fill: '80%', color: '#22c55e' },
    { name: 'Optimisé',  fill: '95%', color: '#6366f1' },
  ];
}