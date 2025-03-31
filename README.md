# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Architecture
![appsnyc-ecs-cdk](https://github.com/user-attachments/assets/8badf617-8776-4c57-abfb-a8d59b504436)


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template

# AppSync ECS CDK Deployment

This repository contains the AWS Cloud Development Kit (CDK) code to deploy an AppSync API connected to an ECS (Elastic Container Service) cluster.

## Project Structure
```
├── .github/workflows/cdk-deploy.yml  # GitHub Actions workflow for CDK deployment
├── bin/
├── cdk.out/
├── graphql/
├── lib/
├── node_modules/
├── test/
├── .gitignore
├── appsync-ecs-cdk.png
├── cdk.context.json
├── cdk.json
├── environments.json
├── jest.config.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json
```

* `.github/workflows/cdk-deploy.yml`: Defines the GitHub Actions workflow for deploying the CDK stack.
* `bin/`: Contains the entry point for the CDK application.
* `cdk.out/`: The directory where the CDK generates CloudFormation templates.
* `graphql/`: Contains GraphQL schema definitions.
* `lib/`: Contains the CDK stack definition.
* `node_modules/`: Contains Node.js dependencies.
* `test/`: Contains unit tests for the CDK stack.
* `.gitignore`: Specifies intentionally untracked files that Git should ignore.
* `appsync-ecs-cdk.png`: (Likely) An image related to the project.
* `cdk.context.json`: CDK context configuration.
* `cdk.json`: CDK project configuration.
* `environments.json`: Contains environment-specific configurations.
* `jest.config.js`: Jest testing framework configuration.
* `package-lock.json`: Lock file for npm dependencies.
* `package.json`: Node.js project configuration and dependencies.
* `README.md`: This file, providing project documentation.
* `tsconfig.json`: TypeScript compiler configuration.

## Deployment using GitHub Actions

The `cdk-deploy.yml` file in `.github/workflows` directory defines a GitHub Actions workflow that automates the deployment of the CDK stack to AWS.

### Workflow Details

* **Trigger:** The workflow is triggered on every push to the `main` branch.
* **Job:** A single job named `deploy` is executed on an `ubuntu-latest` runner.
* **Steps:**
    1.  **Checkout Code:** Checks out the repository's code.
    2.  **Set up Node.js:** Sets up Node.js version 18.
    3.  **Install Dependencies:** Installs project dependencies using `npm install`.
    4.  **Install AWS CDK:** Installs the AWS CDK globally using `npm install -g aws-cdk`.
    5.  **Configure AWS Credentials:** Configures AWS credentials using GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
    6.  **Bootstrap CDK (If Required):** Bootstraps the CDK environment if it hasn't been done before.
    7.  **Deploy CDK Stack:** Deploys the CDK stack using `cdk deploy`. The environment is specified using the `-c env=${{ env.ENVIRONMENT }}` flag, and `--all` deploys all stacks in the project. `--require-approval never` is used to bypass interactive approval prompts.

### Prerequisites

* AWS account with appropriate permissions.
* GitHub repository with the CDK code.
* GitHub Secrets configured with `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_REGION`.
* CDK bootstrapped in the target AWS account and region (if not using the bootstrap step in the workflow).

### Usage

1.  **Clone the repository.**
2.  **Configure AWS credentials:** Ensure you have configured the necessary AWS credentials as GitHub Secrets in your repository.
3.  **Customize `environments.json`:** Modify the `environments.json` file to match your desired environment configuration.
4.  **Push changes to the `main` branch:** The GitHub Actions workflow will automatically trigger and deploy the CDK stack.

## CDK Stack Details

The CDK stack defined in the `lib` directory likely includes the following resources:

* **AppSync API:** A GraphQL API using AWS AppSync.
* **ECS Cluster:** An Amazon ECS cluster to run containerized applications.
* **ECS Task Definition:** Defines the container and resource requirements for the ECS tasks.
* **ECS Service:** Manages the deployment and scaling of ECS tasks.
* **Data Sources:** Connects AppSync resolvers to the ECS service.
* **IAM Roles and Policies:** Defines the necessary permissions for the services.

## Install dependencies
npm install

## Install AWS CDK globally
npm install -g aws-cdk

## Configure AWS credentials (Make sure to set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION in your environment)
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=your-region

## Bootstrap CDK (only if it's the first time deploying)
cdk bootstrap aws://your-account-id/your-region

## Deploy the CDK stack
cdk deploy --all --require-approval never

This README provides a basic overview of the project. For more detailed information, please refer to the CDK code in the `lib` directory and the documentation for the AWS services used.